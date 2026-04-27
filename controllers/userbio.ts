import { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { JwtModule, AccessTokenPayloadFn } from '../types';
import type { Database } from '../db';
import { users } from '../db/schema';

const saveBio = async (req: Request, res: Response, db: Database, jwt: JwtModule, accessTokenPayload: AccessTokenPayloadFn): Promise<void> => {
	const { bio } = req.body;
	try {
		const { username } = await accessTokenPayload(req, res, jwt, db);
		await db.update(users)
			.set({ bio })
			.where(eq(users.userName, username));
		res.sendStatus(200);
	} catch (error) {
		res.sendStatus(400);
	}
};

export { saveBio };
