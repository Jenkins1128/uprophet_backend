import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { db } from '../db';
import { users, login } from '../db/schema';

const SITE_KEY = process.env.SITE_KEY!;
const NONCE_SALT = process.env.NONCE_SALT!;

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

export const handleSignup = async (req: Request, res: Response, next: NextFunction) => {
	const { username, name, email, password } = req.body;
	const userreg = new Date().getTime();
	const hash = hashPass(username, password, userreg);

	await db.transaction(async (tx) => {
		const usersResult = await tx.insert(users).values({
			name: name,
			userName: username,
			email: email,
		}).$returningId();
		const usersId = (usersResult[0] as { id: number }).id;

		const loginResult = await tx.insert(login).values({
			password: hash,
			userName: username,
			usersId: usersId,
			userRegistered: userreg,
		}).$returningId();

		if (loginResult.length) {
			res.json((loginResult[0] as { id: number }).id);
		}
	});
};
