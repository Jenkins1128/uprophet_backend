import { eq, inArray, sql, count, and } from 'drizzle-orm';
import { db } from '../db';
import { quotes, likes, favoriting, quoteNotifications, comments } from '../db/schema';

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
		.where(sql`${likes.usersId} = ${userId} AND ${likes.quotesId} IN ${extractedMaxIds}`)
		.groupBy(likes.quotesId);
	
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

export const createNewQuote = async (username: string, title: string, quote: string) => {
	const datePosted = process.env.NODE_ENV === 'production'
		? new Date().toISOString().replace('T', ' ').substr(0, 19)
		: new Date().toLocaleString('sv-SE').slice(0, 19);

	const result = await db.insert(quotes).values({
		userName: username,
		title,
		quote,
		datePosted,
	}).$returningId();

	const quoteId = (result[0] as { id: number }).id;
	const extractedQuote = await db.select().from(quotes).where(eq(quotes.id, quoteId));
	
	return { ...extractedQuote[0], likeCount: 0, didLike: false };
};

export const likeAQuote = async (userId: number, username: string, quoteId: number) => {
	await db.transaction(async (tx) => {
		await tx.insert(likes).values({
			usersId: userId,
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
};

export const unlikeAQuote = async (userId: number, quoteId: number) => {
	await db.delete(likes).where(
		and(eq(likes.usersId, userId), eq(likes.quotesId, quoteId))
	);
};

export const getCommentsForQuote = async (quoteId: number) => {
	return await db.select().from(comments)
		.where(eq(comments.quotesId, quoteId))
		.orderBy(sql`${comments.id} DESC`);
};

export const addQuoteComment = async (username: string, quoteId: number, comment: string) => {
	const date = process.env.NODE_ENV === 'production'
		? new Date().toISOString().replace('T', ' ').substr(0, 19)
		: new Date().toLocaleString('sv-SE').slice(0, 19);

	return await db.transaction(async (tx) => {
		const result = await tx.insert(comments).values({
			quotesId: quoteId,
			comment: comment,
			commenter: username,
			datePosted: date,
		}).$returningId();

		await tx.insert(quoteNotifications).values({
			notice: `${username} commented on your quote.`,
			quotesId: quoteId,
			date: date,
		});

		const addedComment = await tx.select().from(comments).where(eq(comments.id, (result[0] as { id: number }).id));
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
