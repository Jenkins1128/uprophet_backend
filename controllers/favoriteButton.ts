import { Request, Response } from 'express';
import { eq, and } from 'drizzle-orm';
import { JwtModule, AccessTokenPayloadFn } from '../types';
import type { Database } from '../db';
import { favoriting, favoriteNotifications } from '../db/schema';

const favoriteUser = async (req: Request, res: Response, db: Database, jwt: JwtModule, accessTokenPayload: AccessTokenPayloadFn): Promise<void> => {
	const { toUser } = req.body;
	try {
		const { username } = await accessTokenPayload(req, res, jwt, db);
		await db.transaction(async (tx) => {
			await tx.insert(favoriting).values({
				fromUser: username,
				toUser: toUser,
			});
			await tx.insert(favoriteNotifications).values({
				notice: `${username} favorited you.`,
				toUser: toUser,
				date: new Date().toISOString().replace('T', ' ').substr(0, 19),
			});
		});
		res.sendStatus(200);
	} catch (error) {
		res.sendStatus(400);
	}
};

const unfavoriteUser = async (req: Request, res: Response, db: Database, jwt: JwtModule, accessTokenPayload: AccessTokenPayloadFn): Promise<void> => {
	const { toUser } = req.body;
	try {
		const { username } = await accessTokenPayload(req, res, jwt, db);
		await db.delete(favoriting).where(
			and(eq(favoriting.fromUser, username), eq(favoriting.toUser, toUser))
		);
		res.sendStatus(200);
	} catch {
		res.sendStatus(400);
	}
};

export { favoriteUser, unfavoriteUser };
