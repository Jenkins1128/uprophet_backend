import { Request, Response } from 'express';
import { inArray, sql, count } from 'drizzle-orm';
import { JwtModule, AccessTokenPayloadFn } from '../types';
import type { Database } from '../db';
import { quotes, likes } from '../db/schema';

const fetchExplore = async (req: Request, res: Response, db: Database, jwt: JwtModule, accessTokenPayload: AccessTokenPayloadFn): Promise<void> => {
	try {
		const { id } = await accessTokenPayload(req, res, jwt, db);

		const randomQuoteIds = await db.select({ id: quotes.id })
			.from(quotes)
			.orderBy(sql`RAND()`)
			.limit(20);
		const extractedQuoteIds = randomQuoteIds.map((row) => row.id);

		if (!extractedQuoteIds.length) {
			res.json([]);
			return;
		}

		const quotesResult = await db.select().from(quotes).where(inArray(quotes.id, extractedQuoteIds));

		//Get quotes with like count added
		const likeCounts = await db.select({
			quotesId: likes.quotesId,
			quoteLikeCount: count(likes.quotesId),
		}).from(likes)
			.where(inArray(likes.quotesId, extractedQuoteIds))
			.groupBy(likes.quotesId);

		const likeCountsMap = new Map<number, number>();
		likeCounts.forEach((lc) => likeCountsMap.set(lc.quotesId, lc.quoteLikeCount));

		//Add didLike to each quote
		const userLikedQuotes = await db.select({ quotesId: likes.quotesId })
			.from(likes)
			.where(sql`${likes.usersId} = ${id} AND ${likes.quotesId} IN ${extractedQuoteIds}`)
			.groupBy(likes.quotesId);
		const likedSet = new Set<number>(userLikedQuotes.map((q) => q.quotesId));

		const finalQuotes = quotesResult.map((quote) => ({
			...quote,
			likeCount: likeCountsMap.get(quote.id) ?? 0,
			didLike: likedSet.has(quote.id),
		}));

		res.json(finalQuotes);
	} catch {
		res.sendStatus(400);
	}
};

export { fetchExplore };
