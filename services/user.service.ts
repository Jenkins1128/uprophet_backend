import { eq, sql, count, desc, and, inArray, like } from 'drizzle-orm';
import { db } from '../db';
import { users, favoriting, quotes, likes, quoteNotifications, favoriteNotifications } from '../db/schema';
import { getDbTimestamp } from '../utils/date.utils';

export const getUserProfileQuotes = async (currentUserId: number, targetUsername: string) => {
	const userQuoteIds = await db.select({ id: quotes.id })
		.from(quotes)
		.where(eq(quotes.userName, targetUsername));
	
	const extractedIds = userQuoteIds.map((row) => row.id);

	if (!extractedIds.length) {
		return [];
	}

	const quotesResult = await db.select().from(quotes)
		.where(inArray(quotes.id, extractedIds))
		.orderBy(desc(quotes.id));

	// Get like counts
	const likeCounts = await db.select({
		quotesId: likes.quotesId,
		quoteLikeCount: count(likes.quotesId),
	}).from(likes)
		.where(inArray(likes.quotesId, extractedIds))
		.groupBy(likes.quotesId);

	const likeCountsMap = new Map<number, number>();
	likeCounts.forEach((lc) => likeCountsMap.set(lc.quotesId, lc.quoteLikeCount));

	// Add didLike
	const userLikedQuotes = await db.select({ quotesId: likes.quotesId })
		.from(likes)
		.where(and(
			eq(likes.usersId, currentUserId),
			inArray(likes.quotesId, extractedIds)
		));
	
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
		.where(and(
			eq(favoriting.fromUser, currentUsername),
			eq(favoriting.toUser, targetUsername)
		));
	
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

export const updateUserBio = async (username: string, bio: string) => {
	await db.update(users)
		.set({ bio })
		.where(eq(users.userName, username));
};

export const updateUserPhoto = async (username: string, name: string, image: string) => {
	await db.update(users)
		.set({
			photoName: name,
			photo: Buffer.from(image, 'utf-8'),
		})
		.where(eq(users.userName, username));
};

export const getUserPhoto = async (username: string) => {
	const img = await db.select({ photo: users.photo })
		.from(users)
		.where(eq(users.userName, username));
	
	return img.length && img[0].photo ? img[0].photo.toString() : null;
};

export const getAndReadNotifications = async (username: string) => {
	return await db.transaction(async (tx) => {
		// Quote notifications with join
		const quoteNotifs = await tx.select({
			id: quoteNotifications.id,
			notice: quoteNotifications.notice,
			quotesId: quoteNotifications.quotesId,
			date: quoteNotifications.date,
			userName: quotes.userName,
		})
			.from(quoteNotifications)
			.innerJoin(quotes, eq(quotes.id, quoteNotifications.quotesId))
			.where(eq(quotes.userName, username))
			.orderBy(desc(quoteNotifications.id))
			.limit(10);

		// Mark quote notifications as read
		const userQuoteIds = await tx.select({ id: quotes.id }).from(quotes).where(eq(quotes.userName, username));
		const ids = userQuoteIds.map((q) => q.id);
		if (ids.length) {
			await tx.update(quoteNotifications)
				.set({ read: 1 })
				.where(and(
					eq(quoteNotifications.read, 0),
					inArray(quoteNotifications.quotesId, ids)
				));
		}

		// Favorite notifications
		const favoriteNotifs = await tx.select({
			id: favoriteNotifications.id,
			notice: favoriteNotifications.notice,
			toUser: favoriteNotifications.toUser,
			date: favoriteNotifications.date,
		})
			.from(favoriteNotifications)
			.where(eq(favoriteNotifications.toUser, username))
			.orderBy(desc(favoriteNotifications.id))
			.limit(10);

		// Mark favorite notifications as read
		await tx.update(favoriteNotifications)
			.set({ read: 1 })
			.where(eq(favoriteNotifications.toUser, username));

		// Combine and sort
		const allNotifications = [
			...quoteNotifs.map((n) => ({ ...n, type: 'quote' as const })),
			...favoriteNotifs.map((n) => ({ ...n, type: 'favorite' as const })),
		];
		allNotifications.sort((a, b) => {
			const dateA = a.date ? new Date(a.date).getTime() : 0;
			const dateB = b.date ? new Date(b.date).getTime() : 0;
			return dateB - dateA;
		});

		return allNotifications;
	});
};

export const getUnreadNotificationCount = async (username: string) => {
	const userQuotes = await db.select({ id: quotes.id })
		.from(quotes)
		.where(eq(quotes.userName, username));
	const quoteIds = userQuotes.map((q) => q.id);

	let quoteNotifCount = 0;
	if (quoteIds.length) {
		const quoteNotifResult = await db.select({ count: count(quoteNotifications.id) })
			.from(quoteNotifications)
			.where(and(
				inArray(quoteNotifications.quotesId, quoteIds),
				eq(quoteNotifications.read, 0)
			));
		quoteNotifCount = quoteNotifResult[0]?.count ?? 0;
	}

	const favoriteNotifResult = await db.select({ count: count(favoriteNotifications.id) })
		.from(favoriteNotifications)
		.where(and(
			eq(favoriteNotifications.toUser, username),
			eq(favoriteNotifications.read, 0)
		));
	const favoriteNotifCount = favoriteNotifResult[0]?.count ?? 0;

	return quoteNotifCount + favoriteNotifCount;
};

export const favoriteAUser = async (fromUser: string, toUser: string) => {
	await db.transaction(async (tx) => {
		await tx.insert(favoriting).values({
			fromUser,
			toUser,
		});
		await tx.insert(favoriteNotifications).values({
			notice: `${fromUser} favorited you.`,
			toUser,
			date: getDbTimestamp(),
		});
	});
};

export const unfavoriteAUser = async (fromUser: string, toUser: string) => {
	await db.delete(favoriting).where(
		and(eq(favoriting.fromUser, fromUser), eq(favoriting.toUser, toUser))
	);
};

export const getFavoritersWithStatus = async (toUser: string, currentUser: string) => {
	const allFavoriters = await db.select({ fromUser: favoriting.fromUser })
		.from(favoriting)
		.where(eq(favoriting.toUser, toUser));
	
	const resultUsers = allFavoriters.map((r) => r.fromUser);

	if (!resultUsers.length) {
		return [];
	}

	const usersFavoritingResult = await db.select({ toUser: favoriting.toUser })
		.from(favoriting)
		.where(and(
			eq(favoriting.fromUser, currentUser),
			inArray(favoriting.toUser, resultUsers)
		));
	
	const favoritedSet = new Set<string>(usersFavoritingResult.map((u) => u.toUser));

	return allFavoriters.map((user) => ({
		from_user: user.fromUser,
		currentUser: currentUser,
		didFavorite: favoritedSet.has(user.fromUser),
	}));
};

export const getFavoritingWithStatus = async (fromUser: string, currentUser: string) => {
	const allFavoriting = await db.select({ toUser: favoriting.toUser })
		.from(favoriting)
		.where(eq(favoriting.fromUser, fromUser));
	
	const resultUsers = allFavoriting.map((r) => r.toUser);

	if (!resultUsers.length) {
		return [];
	}

	const usersFavoritingResult = await db.select({ toUser: favoriting.toUser })
		.from(favoriting)
		.where(and(
			eq(favoriting.fromUser, currentUser),
			inArray(favoriting.toUser, resultUsers)
		));
	
	const favoritedSet = new Set<string>(usersFavoritingResult.map((u) => u.toUser));

	return allFavoriting.map((user) => ({
		to_user: user.toUser,
		currentUser: currentUser,
		didFavorite: favoritedSet.has(user.toUser),
	}));
};

export const searchUsersWithStatus = async (search: string, currentUsername: string) => {
	const results = await db.select({ id: users.id, userName: users.userName })
		.from(users)
		.where(like(users.userName, `%${search}%`))
		.limit(15);
	
	const resultUserNames = results.map((r) => r.userName).filter((name): name is string => name !== null);

	if (!resultUserNames.length) {
		return [];
	}

	const usersFavoritingResult = await db.select({ toUser: favoriting.toUser })
		.from(favoriting)
		.where(and(
			eq(favoriting.fromUser, currentUsername),
			inArray(favoriting.toUser, resultUserNames)
		));
	
	const favoritedSet = new Set<string>(usersFavoritingResult.map((u) => u.toUser));

	return results.map((user) => ({
		id: user.id,
		user_name: user.userName,
		currentUser: currentUsername,
		didFavorite: favoritedSet.has(user.userName ?? ''),
	}));
};
