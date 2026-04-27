import { Request, Response } from 'express';
import { eq, inArray, sql, count, desc } from 'drizzle-orm';
import { JwtModule, AccessTokenPayloadFn } from '../types';
import type { Database } from '../db';
import { quotes, likes, favoriting, users } from '../db/schema';

const fetchProfileQuotes = async (req: Request, res: Response, db: Database, jwt: JwtModule, accessTokenPayload: AccessTokenPayloadFn): Promise<void> => {
	const { username } = req.body;
	try {
		const { id } = await accessTokenPayload(req, res, jwt, db);

		const userQuoteIds = await db.select({ id: quotes.id })
			.from(quotes)
			.where(eq(quotes.userName, username));
		const extractedIds = userQuoteIds.map((row) => row.id);

		if (!extractedIds.length) {
			res.json([]);
			return;
		}

		const quotesResult = await db.select().from(quotes)
			.where(inArray(quotes.id, extractedIds))
			.orderBy(desc(quotes.id));

		//Get quotes with like count added
		const likeCounts = await db.select({
			quotesId: likes.quotesId,
			quoteLikeCount: count(likes.quotesId),
		}).from(likes)
			.where(inArray(likes.quotesId, extractedIds))
			.groupBy(likes.quotesId);

		const likeCountsMap = new Map<number, number>();
		likeCounts.forEach((lc) => likeCountsMap.set(lc.quotesId, lc.quoteLikeCount));

		//Add didLike to each quote
		const userLikedQuotes = await db.select({ quotesId: likes.quotesId })
			.from(likes)
			.where(sql`${likes.usersId} = ${id} AND ${likes.quotesId} IN ${extractedIds}`)
			.groupBy(likes.quotesId);
		const likedSet = new Set<number>(userLikedQuotes.map((q) => q.quotesId));

		const finalQuotes = quotesResult.map((quote) => ({
			...quote,
			likeCount: likeCountsMap.get(quote.id) ?? 0,
			didLike: likedSet.has(quote.id),
		}));

		res.json(finalQuotes);
	} catch (error) {
		res.sendStatus(400);
	}
};

const getUserInfo = async (req: Request, res: Response, db: Database, jwt: JwtModule, accessTokenPayload: AccessTokenPayloadFn): Promise<void> => {
	const { username } = req.body;
	const profileUser = username;
	try {
		const { username: currentUser } = await accessTokenPayload(req, res, jwt, db);

		//favoriters, favoriting counts
		const favoritersCount = await db.select({ count: count(favoriting.toUser) })
			.from(favoriting)
			.where(eq(favoriting.toUser, profileUser));
		const favoritingCount = await db.select({ count: count(favoriting.fromUser) })
			.from(favoriting)
			.where(eq(favoriting.fromUser, profileUser));

		//Add didFavorite to each user
		const userFavoritingResult = await db.select({ toUser: favoriting.toUser })
			.from(favoriting)
			.where(sql`${favoriting.fromUser} = ${currentUser} AND ${favoriting.toUser} = ${profileUser}`);
		const didFavorite = userFavoritingResult.length > 0;

		//bio
		const bioResult = await db.select({ bio: users.bio })
			.from(users)
			.where(eq(users.userName, profileUser));

		const userInfo = {
			currentUser,
			didFavorite,
			favoriters: favoritersCount[0]?.count ?? 0,
			favoriting: favoritingCount[0]?.count ?? 0,
			bio: bioResult[0]?.bio ?? null,
		};
		res.json(userInfo);
	} catch {
		res.sendStatus(400);
	}
};

const getCurrentUserInfo = async (req: Request, res: Response, db: Database, jwt: JwtModule, accessTokenPayload: AccessTokenPayloadFn): Promise<void> => {
	try {
		const { username } = await accessTokenPayload(req, res, jwt, db);
		//bio
		const bioResult = await db.select({ bio: users.bio })
			.from(users)
			.where(eq(users.userName, username));
		const userInfo = { currentUser: username, bio: bioResult[0]?.bio ?? null };
		res.json(userInfo);
	} catch {
		res.sendStatus(400);
	}
};

export { fetchProfileQuotes, getUserInfo, getCurrentUserInfo };
