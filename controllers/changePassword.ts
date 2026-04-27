import { Request, Response } from 'express';
import { Knex } from 'knex';
import { CryptoModule } from '../types';

interface LoginRecord {
	user_name: string;
	password: string;
	users_id: number;
	user_registered: number;
}

const compare = (username: string, password: string, data: LoginRecord[], crypto: CryptoModule, NONCE_SALT: string, SITE_KEY: string): boolean => {
	const storeg = data[0].user_registered;
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

const changePassword = async (req: Request, res: Response, db: Knex, crypto: CryptoModule, NONCE_SALT: string, SITE_KEY: string): Promise<void> => {
	const { username, password } = req.body;
	if (!username || !password || !username.length || !password.length) {
		res.sendStatus(400);
		return;
	}
	const userreg = new Date().getTime();
	const hash = hashPass(username, password, userreg, crypto, NONCE_SALT, SITE_KEY);

	try {
		await db('login')
			.update({
				password: hash,
				user_registered: userreg
			})
			.where('user_name', username);
		res.sendStatus(200);
	} catch (err) {
		res.sendStatus(400);
	}
};

const changePasswordSignin = async (req: Request, res: Response, db: Knex, crypto: CryptoModule, NONCE_SALT: string, SITE_KEY: string): Promise<void> => {
	const { username, password } = req.body;
	if (!username || !password) {
		res.sendStatus(400);
		return;
	}

	const trx = await db.transaction();
	try {
		const data: LoginRecord[] = await trx('login').select('user_name', 'password', 'users_id', 'user_registered').where('user_name', username);
		if (compare(username, password, data, crypto, NONCE_SALT, SITE_KEY)) {
			res.sendStatus(200);
		} else {
			res.sendStatus(401);
		}
		await trx.commit();
	} catch (err) {
		await trx.rollback();
		res.sendStatus(401);
	}
};

export { changePasswordSignin, changePassword };
