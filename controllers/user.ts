import { Request, Response } from 'express';
import { Knex } from 'knex';
import { JwtModule, AccessTokenPayloadFn } from '../types';

const getUser = async (req: Request, res: Response, db: Knex, jwt: JwtModule, accessTokenPayload: AccessTokenPayloadFn): Promise<void> => {
	try {
		//get user from access token
		const { username } = await accessTokenPayload(req, res, jwt, db);
		res.json(username);
	} catch (error: any) {
		res.sendStatus(Number(error.message) || 400);
	}
};

export { getUser };
