import { Request, Response } from 'express';
import { eq, sql, and } from 'drizzle-orm';
import { JwtModule, AccessTokenPayloadFn } from '../types';
import type { Database } from '../db';
import { likes, quoteNotifications } from '../db/schema';

const likeQuote = async (req: Request, res: Response, db: Database, jwt: JwtModule, accessTokenPayload: AccessTokenPayloadFn): Promise<void> => {
	const { quoteId } = req.body;
	try {
		//get username, id from access token
		const { id, username } = await accessTokenPayload(req, res, jwt, db);
		await db.transaction(async (tx) => {
			await tx.insert(likes).values({
				usersId: id,
				quotesId: quoteId,
			});
			await tx.insert(quoteNotifications).values({
				notice: `${username} liked your quote.`,
				quotesId: quoteId,
				date: process.env.NODE_ENV === 'production'
					? new Date().toISOString().replace('T', ' ').substr(0, 19)
					: new Date().toLocaleString('sv-SE').slice(0, 19),
			});
		});
		res.sendStatus(200);
	} catch (error) {
		res.sendStatus(400);
	}
};

const unlikeQuote = async (req: Request, res: Response, db: Database, jwt: JwtModule, accessTokenPayload: AccessTokenPayloadFn): Promise<void> => {
	const { quoteId } = req.body;
	try {
		//get username, id from access token
		const { id } = await accessTokenPayload(req, res, jwt, db);
		await db.delete(likes).where(
			and(eq(likes.usersId, id), eq(likes.quotesId, quoteId))
		);
		res.sendStatus(200);
	} catch {
		res.sendStatus(400);
	}
};

export { likeQuote, unlikeQuote };
