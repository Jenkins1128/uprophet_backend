import { Request, Response } from 'express';
import { eq, inArray, sql, count, desc } from 'drizzle-orm';
import { JwtModule, AccessTokenPayloadFn } from '../types';
import type { Database } from '../db';
import { quotes, likes, favoriting } from '../db/schema';

const fetchHome = async (req: Request, res: Response, db: Database, jwt: JwtModule, accessTokenPayload: AccessTokenPayloadFn): Promise<void> => {
	try {
		//get user from access token
		const { id, username } = await accessTokenPayload(req, res, jwt, db);

		//Get the latest quote from each user you are following
		const followedUsers = await db.select({ toUser: favoriting.toUser })
			.from(favoriting)
			.where(eq(favoriting.fromUser, username));
		const allUsers = followedUsers.map((u) => u.toUser);
		allUsers.push(username);

		const maxIds = await db.select({ maxId: sql<number>`max(${quotes.id})` })
			.from(quotes)
			.where(inArray(quotes.userName, allUsers))
			.groupBy(quotes.userName);
		const extractedMaxIds = maxIds.map((row) => row.maxId);

		if (!extractedMaxIds.length) {
			res.json([]);
			return;
		}

		const quotesResult = await db.select().from(quotes).where(inArray(quotes.id, extractedMaxIds));

		//Get quotes with like count added
		const likeCounts = await db.select({
			quotesId: likes.quotesId,
			quoteLikeCount: count(likes.quotesId),
		}).from(likes)
			.where(inArray(likes.quotesId, extractedMaxIds))
			.groupBy(likes.quotesId);

		const likeCountsMap = new Map<number, number>();
		likeCounts.forEach((lc) => likeCountsMap.set(lc.quotesId, lc.quoteLikeCount));

		//Add didLike to each quote
		const userLikedQuotes = await db.select({ quotesId: likes.quotesId })
			.from(likes)
			.where(sql`${likes.usersId} = ${id} AND ${likes.quotesId} IN ${extractedMaxIds}`)
			.groupBy(likes.quotesId);
		const likedSet = new Set<number>(userLikedQuotes.map((q) => q.quotesId));

		const finalQuotes = quotesResult.map((quote) => ({
			...quote,
			likeCount: likeCountsMap.get(quote.id) ?? 0,
			didLike: likedSet.has(quote.id),
		}));

		finalQuotes.sort((a, b) => {
			const dateA = a.datePosted ? new Date(a.datePosted).getTime() : 0;
			const dateB = b.datePosted ? new Date(b.datePosted).getTime() : 0;
			return dateB - dateA;
		});

		res.json(finalQuotes);
	} catch (error) {
		res.sendStatus(400);
	}
};

const createQuote = async (req: Request, res: Response, db: Database, jwt: JwtModule, accessTokenPayload: AccessTokenPayloadFn): Promise<void> => {
	const { title, quote } = req.body;
	try {
		//get user from access token
		const { username } = await accessTokenPayload(req, res, jwt, db);
		const datePosted = process.env.NODE_ENV === 'production'
			? new Date().toISOString().replace('T', ' ').substr(0, 19)
			: new Date().toLocaleString('sv-SE').slice(0, 19);

		const result = await db.insert(quotes).values({
			userName: username,
			title: title,
			quote: quote,
			datePosted: datePosted,
		}).$returningId();

		const quoteId = (result[0] as { id: number }).id;
		const extractedQuote = await db.select().from(quotes).where(eq(quotes.id, quoteId));
		const finalQuote = { ...extractedQuote[0], likeCount: 0, didLike: false };
		res.json(finalQuote);
	} catch {
		res.sendStatus(400);
	}
};

export { fetchHome, createQuote };
