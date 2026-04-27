import { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { JwtModule, AccessTokenPayloadFn } from '../types';
import type { Database } from '../db';
import { users } from '../db/schema';

const getUser = async (req: Request, res: Response, db: Database, jwt: JwtModule, accessTokenPayload: AccessTokenPayloadFn): Promise<void> => {
	try {
		//get user from access token
		const { username } = await accessTokenPayload(req, res, jwt, db);
		res.json(username);
	} catch (error: any) {
		res.sendStatus(Number(error.message) || 400);
	}
};

export { getUser };
