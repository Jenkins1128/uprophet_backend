import { Response, NextFunction } from 'express';
import { eq, count, and, inArray } from 'drizzle-orm';
import { db } from '../db';
import { quoteNotifications, quotes, favoriteNotifications } from '../db/schema';
import { AuthRequest } from '../types';

export const getNotificationCount = async (req: AuthRequest, res: Response, next: NextFunction) => {
	const { username } = req.user!;

	// Get user's quote IDs for notification lookup
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

	res.json({ notificationCount: quoteNotifCount + favoriteNotifCount });
};
