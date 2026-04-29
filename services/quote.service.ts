import { eq, inArray, sql, count, and, desc } from 'drizzle-orm';
import { db } from '../db';
import { quotes, likes, favoriting, quoteNotifications, comments } from '../db/schema';
import { getDbTimestamp } from '../utils/date.utils';

export const getHomeQuotes = async (userId: number, username: string) => {
	// 1. Get users followed by current user
	const followedUsers = await db.select({ toUser: favoriting.toUser })
		.from(favoriting)
		.where(eq(favoriting.fromUser, username));
	
	const allUsers = followedUsers.map((u) => u.toUser);
	allUsers.push(username);

	// 2. Get latest quote ID for each followed user
	const maxIds = await db.select({ maxId: sql<number>`max(${quotes.id})` })
		.from(quotes)
		.where(inArray(quotes.userName, allUsers))
		.groupBy(quotes.userName);
	
	const extractedMaxIds = maxIds.map((row) => row.maxId);

	if (!extractedMaxIds.length) {
		return [];
	}

	// 3. Fetch the actual quotes
	const quotesResult = await db.select().from(quotes).where(inArray(quotes.id, extractedMaxIds));

	// 4. Get like counts for these quotes
	const likeCounts = await db.select({
		quotesId: likes.quotesId,
		quoteLikeCount: count(likes.quotesId),
	}).from(likes)
		.where(inArray(likes.quotesId, extractedMaxIds))
		.groupBy(likes.quotesId);

	const likeCountsMap = new Map<number, number>();
	likeCounts.forEach((lc) => likeCountsMap.set(lc.quotesId, lc.quoteLikeCount));

	// 5. Check which ones the user liked
	const userLikedQuotes = await db.select({ quotesId: likes.quotesId })
		.from(likes)
		.where(and(
			eq(likes.usersId, userId),
			inArray(likes.quotesId, extractedMaxIds)
		));
	
	const likedSet = new Set<number>(userLikedQuotes.map((q) => q.quotesId));

	// 6. Assemble final data
	const finalQuotes = quotesResult.map((quote) => ({
		...quote,
		likeCount: likeCountsMap.get(quote.id) ?? 0,
		didLike: likedSet.has(quote.id),
	}));

	// 7. Sort by date
	return finalQuotes.sort((a, b) => {
		const dateA = a.datePosted ? new Date(a.datePosted).getTime() : 0;
		const dateB = b.datePosted ? new Date(b.datePosted).getTime() : 0;
		return dateB - dateA;
	});
};

export const getRandomExploreQuotes = async (userId: number) => {
	const randomQuoteIds = await db.select({ id: quotes.id })
		.from(quotes)
		.orderBy(sql`RAND()`)
		.limit(20);
	const extractedQuoteIds = randomQuoteIds.map((row) => row.id);

	if (!extractedQuoteIds.length) {
		return [];
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
			eq(likes.usersId, userId),
			inArray(likes.quotesId, extractedQuoteIds)
		));
	const likedSet = new Set<number>(userLikedQuotes.map((q) => q.quotesId));

	return quotesResult.map((quote) => ({
		...quote,
		likeCount: likeCountsMap.get(quote.id) ?? 0,
		didLike: likedSet.has(quote.id),
	}));
};

export const createNewQuote = async (username: string, title: string, quote: string) => {
	const datePosted = getDbTimestamp();

	const result = await db.insert(quotes).values({
		userName: username,
		title,
		quote,
		datePosted,
	});

	const quoteId = result[0].insertId;
	const extractedQuote = await db.select().from(quotes).where(eq(quotes.id, quoteId));
	
	if (!extractedQuote.length) {
		throw new Error('Failed to retrieve created quote');
	}
	
	return { ...extractedQuote[0], likeCount: 0, didLike: false };
};

export const likeAQuote = async (userId: number, username: string, quoteId: number) => {
	const date = getDbTimestamp();
	await db.transaction(async (tx) => {
		await tx.insert(likes).values({
			usersId: userId,
			quotesId: quoteId,
		});
		await tx.insert(quoteNotifications).values({
			notice: `${username} liked your quote.`,
			quotesId: quoteId,
			date: date,
		});
	});
};

export const unlikeAQuote = async (userId: number, quoteId: number) => {
	await db.delete(likes).where(
		and(eq(likes.usersId, userId), eq(likes.quotesId, quoteId))
	);
};

export const getCommentsForQuote = async (quoteId: number) => {
	return await db.select().from(comments)
		.where(eq(comments.quotesId, quoteId))
		.orderBy(desc(comments.id));
};

export const addQuoteComment = async (username: string, quoteId: number, commentText: string) => {
	const date = getDbTimestamp();

	return await db.transaction(async (tx) => {
		const result = await tx.insert(comments).values({
			quotesId: quoteId,
			comment: commentText,
			commenter: username,
			datePosted: date,
		});

		await tx.insert(quoteNotifications).values({
			notice: `${username} commented on your quote.`,
			quotesId: quoteId,
			date: date,
		});

		const addedComment = await tx.select().from(comments).where(eq(comments.id, result[0].insertId));
		if (!addedComment.length) {
			throw new Error('Failed to retrieve added comment');
		}
		return addedComment[0];
	});
};

export const getSingleQuote = async (userId: number, quoteId: number) => {
	const quotePost = await db.select().from(quotes).where(eq(quotes.id, quoteId));
	if (!quotePost.length) return null;

	const likeCountResult = await db.select({ likeCount: count(likes.usersId) })
		.from(likes)
		.where(eq(likes.quotesId, quoteId));
	
	const didLikeResult = await db.select({ usersId: likes.usersId })
		.from(likes)
		.where(eq(likes.quotesId, quoteId));
	
	const didLike = didLikeResult.some((row) => row.usersId === userId);

	return {
		...quotePost[0],
		likeCount: likeCountResult[0]?.likeCount ?? 0,
		didLike,
	};
};

export const deleteQuote = async (quoteId: number) => {
	await db.delete(quotes).where(eq(quotes.id, quoteId));
};
