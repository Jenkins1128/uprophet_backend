import { Request, Response } from 'express';
import { CryptoModule } from '../types';
import type { Database } from '../db';
import { users, login } from '../db/schema';

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

const handleSignup = async (req: Request, res: Response, db: Database, crypto: CryptoModule, NONCE_SALT: string, SITE_KEY: string): Promise<void> => {
	const { username, name, email, password } = req.body;
	const userreg = new Date().getTime();
	const hash = hashPass(username, password, userreg, crypto, NONCE_SALT, SITE_KEY);
	try {
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
	} catch (err) {
		res.sendStatus(400);
	}
};

export { handleSignup };
