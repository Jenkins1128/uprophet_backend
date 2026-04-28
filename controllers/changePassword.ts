import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { login } from '../db/schema';

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

const hashPass = (username: string, password: string, userreg: number): string => {
	const nonce = crypto
		.createHash('md5')
		.update('registration-' + username + userreg + NONCE_SALT)
		.digest('hex');
	const userpass = crypto
		.createHmac('sha512', SITE_KEY)
		.update(password + nonce)
		.digest('hex');
	return userpass;
};

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
	const { username, password } = req.body;
	const userreg = new Date().getTime();
	const hash = hashPass(username, password, userreg);

	await db.update(login)
		.set({ password: hash, userRegistered: userreg })
		.where(eq(login.userName, username));
	res.sendStatus(200);
};

export const changePasswordSignin = async (req: Request, res: Response, next: NextFunction) => {
	const { username, password } = req.body;
	const data = await db.select({
		userName: login.userName,
		password: login.password,
		usersId: login.usersId,
		userRegistered: login.userRegistered,
	}).from(login).where(eq(login.userName, username));

	if (compare(username, password, data)) {
		res.sendStatus(200);
	} else {
		res.status(401).json({ message: 'Invalid credentials' });
	}
};
