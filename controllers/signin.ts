import { Request, Response } from 'express';
import type { SignOptions } from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { TokenPayload, JwtModule, AccessTokenPayloadFn, CryptoModule } from '../types';
import type { Database } from '../db';
import { login, users } from '../db/schema';

interface LoginRecord {
	userName: string;
	password: string;
	usersId: number;
	userRegistered: number;
}

const compare = (username: string, password: string, data: LoginRecord[], crypto: CryptoModule, NONCE_SALT: string, SITE_KEY: string): boolean => {
	const storeg = data[0].userRegistered;
	//The hashed password of the stored matching user
	const stopass = data[0].password;
	//Recreate our NONCE used at registration
	const nonce = crypto
		.createHash('md5')
		.update('registration-' + username + storeg + NONCE_SALT)
		.digest('hex');
	//Rehash the submitted password to see if it matches the stored hash
	const subpass = crypto
		.createHmac('sha512', SITE_KEY)
		.update(password + nonce)
		.digest('hex');
	return subpass === stopass;
};

const logout = async (req: Request, res: Response, db: Database, jwt: JwtModule, accessTokenPayload: AccessTokenPayloadFn): Promise<void> => {
	try {
		const { username } = await accessTokenPayload(req, res, jwt, db);
		await db.update(users).set({ refreshToken: '' }).where(eq(users.userName, username));
		res.clearCookie('upUserId');
		res.sendStatus(204);
	} catch (error) {
		res.sendStatus(500);
	}
};

const accessTokenPayload = async (req: Request, res: Response, jwt: JwtModule, db: Database): Promise<TokenPayload> => {
	let accessToken: string = req.cookies.upUserId;
	if (!accessToken) {
		throw new Error('403');
	}
	//verify the acess token
	try {
		jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET!);
		const base64Payload = accessToken.split('.')[1];
		const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString('utf-8')) as TokenPayload;
		return payload;
	} catch {}

	const base64Payload = accessToken.split('.')[1];
	const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString('utf-8')) as TokenPayload;
	//retrieve the refresh token from database
	let refreshTokenRows: { refreshToken: string | null }[];
	try {
		refreshTokenRows = await db.select({ refreshToken: users.refreshToken })
			.from(users)
			.where(eq(users.userName, payload.username));
	} catch (error) {
		throw new Error('400');
	}

	if (!refreshTokenRows.length || !refreshTokenRows[0].refreshToken) {
		throw new Error('403');
	}
	//verify the refresh token
	try {
		jwt.verify(refreshTokenRows[0].refreshToken, process.env.REFRESH_TOKEN_SECRET!);
	} catch (e) {
		throw new Error('403');
	}

	const signOptions: SignOptions = {
		algorithm: 'HS256',
		expiresIn: process.env.ACCESS_TOKEN_LIFE as any,
	};
	let newToken = jwt.sign({ id: payload.id, username: payload.username }, process.env.ACCESS_TOKEN_SECRET!, signOptions);
	res.cookie('upUserId', newToken, {
		httpOnly: true,
		secure: true, // Must be true for HTTPS
		sameSite: 'none', // Must be 'none' for cross-domain (uprophet.com -> api.uprophet.com)
		maxAge: 1000 * 60 * 60 * 24, // 24 hours
	});
	const base64Payload2 = newToken.split('.')[1];
	const newTokenPayload = JSON.parse(Buffer.from(base64Payload2, 'base64').toString('utf-8')) as TokenPayload;
	return newTokenPayload;
};

const handleSignin = async (req: Request, res: Response, db: Database, crypto: CryptoModule, NONCE_SALT: string, SITE_KEY: string, jwt: JwtModule): Promise<void> => {
	const { username, password } = req.body;
	try {
		const data = await db.select({
			userName: login.userName,
			password: login.password,
			usersId: login.usersId,
			userRegistered: login.userRegistered,
		}).from(login).where(eq(login.userName, username));

		if (compare(username, password, data, crypto, NONCE_SALT, SITE_KEY)) {
			const payload = { id: data[0].usersId, username: data[0].userName };
			const accessSignOptions: SignOptions = {
				algorithm: 'HS256',
				expiresIn: process.env.ACCESS_TOKEN_LIFE as any,
			};
			const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET!, accessSignOptions);
			const refreshSignOptions: SignOptions = {
				algorithm: 'HS256',
				expiresIn: process.env.REFRESH_TOKEN_LIFE as any,
			};
			const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET!, refreshSignOptions);
			await db.update(users).set({ refreshToken }).where(eq(users.userName, username));
			res.cookie('upUserId', accessToken, {
				httpOnly: true,
				secure: true, // Must be true for HTTPS
				sameSite: 'none', // Must be 'none' for cross-domain (uprophet.com -> api.uprophet.com)
				maxAge: 1000 * 60 * 60 * 24, // 24 hours
			});
			res.sendStatus(200);
		} else {
			res.sendStatus(401);
		}
	} catch (err) {
		res.sendStatus(401);
	}
};

export { handleSignin, accessTokenPayload, logout };
