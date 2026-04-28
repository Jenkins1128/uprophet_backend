import { Response, NextFunction } from 'express';
import { inArray, sql, count, and, eq } from 'drizzle-orm';
import { db } from '../db';
import { quotes, likes } from '../db/schema';
import { AuthRequest } from '../types';

export const fetchExplore = async (req: AuthRequest, res: Response, next: NextFunction) => {
	const { id } = req.user!;

	const randomQuoteIds = await db.select({ id: quotes.id })
		.from(quotes)
		.orderBy(sql`RAND()`)
		.limit(20);
	const extractedQuoteIds = randomQuoteIds.map((row) => row.id);

	if (!extractedQuoteIds.length) {
		return res.json([]);
	}

	const quotesResult = await db.select().from(quotes).where(inArray(quotes.id, extractedQuoteIds));

	// Get like counts
	const likeCounts = await db.select({
		quotesId: likes.quotesId,
		quoteLikeCount: count(likes.quotesId),
	}).from(likes)
		.where(inArray(likes.quotesId, extractedQuoteIds))
		.groupBy(likes.quotesId);

	const likeCountsMap = new Map<number, number>();
	likeCounts.forEach((lc) => likeCountsMap.set(lc.quotesId, lc.quoteLikeCount));

	// Add didLike
	const userLikedQuotes = await db.select({ quotesId: likes.quotesId })
		.from(likes)
		.where(and(
			eq(likes.usersId, id),
			inArray(likes.quotesId, extractedQuoteIds)
		));
	const likedSet = new Set<number>(userLikedQuotes.map((q) => q.quotesId));

	const finalQuotes = quotesResult.map((quote) => ({
		...quote,
		likeCount: likeCountsMap.get(quote.id) ?? 0,
		didLike: likedSet.has(quote.id),
	}));

	res.json(finalQuotes);
};
