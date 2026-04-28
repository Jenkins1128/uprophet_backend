import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { login, users } from '../db/schema';
import { AuthRequest } from '../types';

const SITE_KEY = process.env.SITE_KEY!;
const NONCE_SALT = process.env.NONCE_SALT!;

interface LoginRecord {
	userName: string;
	password: string;
	usersId: number;
	userRegistered: number;
}

const compare = (username: string, password: string, data: LoginRecord[]): boolean => {
	if (!data.length) return false;
	const storeg = data[0].userRegistered;
	const stopass = data[0].password;
	const nonce = crypto
		.createHash('md5')
		.update('registration-' + username + storeg + NONCE_SALT)
		.digest('hex');
	const subpass = crypto
		.createHmac('sha512', SITE_KEY)
		.update(password + nonce)
		.digest('hex');
	return subpass === stopass;
};

export const handleSignin = async (req: Request, res: Response, next: NextFunction) => {
	const { username, password } = req.body;
	const data = await db.select({
		userName: login.userName,
		password: login.password,
		usersId: login.usersId,
		userRegistered: login.userRegistered,
	}).from(login).where(eq(login.userName, username));

	if (compare(username, password, data)) {
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
			secure: true,
			sameSite: 'none',
			maxAge: 1000 * 60 * 60 * 24, // 24 hours
		});
		res.sendStatus(200);
	} else {
		res.status(401).json({ message: 'Invalid credentials' });
	}
};

export const logout = async (req: AuthRequest, res: Response, next: NextFunction) => {
	const { username } = req.user!;
	await db.update(users).set({ refreshToken: '' }).where(eq(users.userName, username));
	res.clearCookie('upUserId');
	res.sendStatus(204);
};
