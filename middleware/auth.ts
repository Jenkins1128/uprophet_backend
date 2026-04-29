import { Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../db/schema';
import { AuthRequest, TokenPayload } from '../types';

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
	let accessToken = req.cookies.upUserId;

	if (!accessToken) {
		return res.status(401).json({ message: 'Not authorized, no token' });
	}

	try {
		// 1. Verify access token
		const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET!) as TokenPayload;
		req.user = decoded;
		return next();
	} catch (error) {
		// 2. Access token is invalid or expired, try to refresh
		try {
			const base64Payload = accessToken.split('.')[1];
			const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString('utf-8')) as TokenPayload;

			const userRows = await db.select({ refreshToken: users.refreshToken })
				.from(users)
				.where(eq(users.userName, payload.username));

			if (!userRows.length || !userRows[0].refreshToken) {
				return res.status(401).json({ message: 'Not authorized, session expired' });
			}

			// 3. Verify refresh token
			jwt.verify(userRows[0].refreshToken, process.env.REFRESH_TOKEN_SECRET!);

			// 4. Generate new access token
			const signOptions: SignOptions = {
				algorithm: 'HS256',
				expiresIn: (process.env.ACCESS_TOKEN_LIFE as SignOptions['expiresIn']) || '1h',
			};

			const newToken = jwt.sign(
				{ id: payload.id, username: payload.username },
				process.env.ACCESS_TOKEN_SECRET!,
				signOptions
			);

			res.cookie('upUserId', newToken, {
				httpOnly: true,
				secure: true,
				sameSite: 'none',
				maxAge: 1000 * 60 * 60 * 24, // 24 hours
			});

			req.user = payload;
			next();
		} catch (refreshError) {
			console.error('Refresh token verification failed:', refreshError);
			return res.status(401).json({ message: 'Not authorized, please login again' });
		}
	}
};
