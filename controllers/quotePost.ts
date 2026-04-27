import { Request, Response } from 'express';
import { eq, count } from 'drizzle-orm';
import { JwtModule, AccessTokenPayloadFn } from '../types';
import type { Database } from '../db';
import { quotes, likes } from '../db/schema';

const getQuotePost = async (req: Request, res: Response, db: Database, jwt: JwtModule, accessTokenPayload: AccessTokenPayloadFn): Promise<void> => {
	const { quoteId } = req.body;
	try {
		const { id } = await accessTokenPayload(req, res, jwt, db);

		const quotePost = await db.select().from(quotes).where(eq(quotes.id, quoteId));
		const likeCountResult = await db.select({ likeCount: count(likes.usersId) })
			.from(likes)
			.where(eq(likes.quotesId, quoteId));
		const didLikeResult = await db.select({ usersId: likes.usersId })
			.from(likes)
			.where(eq(likes.quotesId, quoteId));
		const didLike = didLikeResult.some((row) => row.usersId === id);

		res.json({
			...quotePost[0],
			likeCount: likeCountResult[0]?.likeCount ?? 0,
			didLike,
		});
	} catch (error) {
		res.sendStatus(400);
	}
};

const deleteQuotePost = async (req: Request, res: Response, db: Database): Promise<void> => {
	const { quoteId } = req.body;
	try {
		await db.delete(quotes).where(eq(quotes.id, quoteId));
		res.sendStatus(200);
	} catch {
		res.sendStatus(400);
	}
};

export { getQuotePost, deleteQuotePost };
