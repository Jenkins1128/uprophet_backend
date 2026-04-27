import { Request, Response } from 'express';
import { Knex } from 'knex';
import { JwtModule, AccessTokenPayloadFn } from '../types';

const saveBio = async (req: Request, res: Response, db: Knex, jwt: JwtModule, accessTokenPayload: AccessTokenPayloadFn): Promise<void> => {
	const { bio } = req.body;
	try {
		const { username } = await accessTokenPayload(req, res, jwt, db);
		await db('users')
			.update({
				bio: bio
			})
			.where('user_name', username);
		res.sendStatus(200);
	} catch (error) {
		res.sendStatus(400);
	}
};

export { saveBio };
