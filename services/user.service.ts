import { eq, sql, count } from 'drizzle-orm';
import { db } from '../db';
import { users, favoriting, quotes, likes } from '../db/schema';

export const getUserProfileQuotes = async (currentUserId: number, targetUsername: string) => {
	const userQuoteIds = await db.select({ id: quotes.id })
		.from(quotes)
		.where(eq(quotes.userName, targetUsername));
	
	const extractedIds = userQuoteIds.map((row) => row.id);

	if (!extractedIds.length) {
		return [];
	}

	const quotesResult = await db.select().from(quotes)
		.where(sql`${quotes.id} IN ${extractedIds}`)
		.orderBy(sql`${quotes.id} DESC`);

	// Get like counts
	const likeCounts = await db.select({
		quotesId: likes.quotesId,
		quoteLikeCount: count(likes.quotesId),
	}).from(likes)
		.where(sql`${likes.quotesId} IN ${extractedIds}`)
		.groupBy(likes.quotesId);

	const likeCountsMap = new Map<number, number>();
	likeCounts.forEach((lc) => likeCountsMap.set(lc.quotesId, lc.quoteLikeCount));

	// Add didLike
	const userLikedQuotes = await db.select({ quotesId: likes.quotesId })
		.from(likes)
		.where(sql`${likes.usersId} = ${currentUserId} AND ${likes.quotesId} IN ${extractedIds}`)
		.groupBy(likes.quotesId);
	
	const likedSet = new Set<number>(userLikedQuotes.map((q) => q.quotesId));

	return quotesResult.map((quote) => ({
		...quote,
		likeCount: likeCountsMap.get(quote.id) ?? 0,
		didLike: likedSet.has(quote.id),
	}));
};

export const getUserInformation = async (currentUsername: string, targetUsername: string) => {
	const favoritersCount = await db.select({ count: count(favoriting.toUser) })
		.from(favoriting)
		.where(eq(favoriting.toUser, targetUsername));
	
	const favoritingCount = await db.select({ count: count(favoriting.fromUser) })
		.from(favoriting)
		.where(eq(favoriting.fromUser, targetUsername));

	const userFavoritingResult = await db.select({ toUser: favoriting.toUser })
		.from(favoriting)
		.where(sql`${favoriting.fromUser} = ${currentUsername} AND ${favoriting.toUser} = ${targetUsername}`);
	
	const didFavorite = userFavoritingResult.length > 0;

	const bioResult = await db.select({ bio: users.bio })
		.from(users)
		.where(eq(users.userName, targetUsername));

	return {
		currentUser: currentUsername,
		didFavorite,
		favoriters: favoritersCount[0]?.count ?? 0,
		favoriting: favoritingCount[0]?.count ?? 0,
		bio: bioResult[0]?.bio ?? null,
	};
};

export const getCurrentUserInfoShort = async (username: string) => {
	const bioResult = await db.select({ bio: users.bio })
		.from(users)
		.where(eq(users.userName, username));
	
	return { currentUser: username, bio: bioResult[0]?.bio ?? null };
};
