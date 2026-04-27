import { Request, Response } from 'express';
import { eq, desc, and } from 'drizzle-orm';
import { JwtModule, AccessTokenPayloadFn } from '../types';
import type { Database } from '../db';
import { quoteNotifications, quotes, favoriteNotifications } from '../db/schema';

const fetchNotifications = async (req: Request, res: Response, db: Database, jwt: JwtModule, accessTokenPayload: AccessTokenPayloadFn): Promise<void> => {
	try {
		const { username } = await accessTokenPayload(req, res, jwt, db);

		await db.transaction(async (tx) => {
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
			await tx.update(quoteNotifications)
				.set({ read: 1 })
				.where(
					and(
						eq(quoteNotifications.read, 0),
						eq(quoteNotifications.quotesId, quoteNotifications.quotesId)
					)
				);
			// Since we need to filter by quotes.user_name, use raw sql for the joined update
			// Drizzle doesn't support joined updates natively, so we use a subquery approach
			const userQuoteIds = await tx.select({ id: quotes.id }).from(quotes).where(eq(quotes.userName, username));
			const ids = userQuoteIds.map((q) => q.id);
			if (ids.length) {
				const { sql: sqlTag, inArray } = await import('drizzle-orm');
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

			res.json(allNotifications);
		});
	} catch (error) {
		res.sendStatus(400);
	}
};

export { fetchNotifications };
