import { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { CryptoModule } from '../types';
import type { Database } from '../db';
import { login } from '../db/schema';

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

const hashPass = (username: string, password: string, userreg: number, crypto: CryptoModule, NONCE_SALT: string, SITE_KEY: string): string => {
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

const changePassword = async (req: Request, res: Response, db: Database, crypto: CryptoModule, NONCE_SALT: string, SITE_KEY: string): Promise<void> => {
	const { username, password } = req.body;
	const userreg = new Date().getTime();
	const hash = hashPass(username, password, userreg, crypto, NONCE_SALT, SITE_KEY);

	try {
		await db.update(login)
			.set({ password: hash, userRegistered: userreg })
			.where(eq(login.userName, username));
		res.sendStatus(200);
	} catch (err) {
		res.sendStatus(400);
	}
};

const changePasswordSignin = async (req: Request, res: Response, db: Database, crypto: CryptoModule, NONCE_SALT: string, SITE_KEY: string): Promise<void> => {
	const { username, password } = req.body;
	try {
		const data = await db.select({
			userName: login.userName,
			password: login.password,
			usersId: login.usersId,
			userRegistered: login.userRegistered,
		}).from(login).where(eq(login.userName, username));

		if (compare(username, password, data, crypto, NONCE_SALT, SITE_KEY)) {
			res.sendStatus(200);
		} else {
			res.sendStatus(401);
		}
	} catch (err) {
		res.sendStatus(401);
	}
};

export { changePasswordSignin, changePassword };
