import { Request, Response } from 'express';
import { Knex } from 'knex';
import { JwtModule, AccessTokenPayloadFn } from '../types';

const getNotificationCount = async (req: Request, res: Response, db: Knex, jwt: JwtModule, accessTokenPayload: AccessTokenPayloadFn): Promise<void> => {
	const trx = await db.transaction();
	try {
		const { username } = await accessTokenPayload(req, res, jwt, db);
		//Add notification count
		const newQuoteNotificationsCount = await trx('quote_notifications')
			.count('quote_notifications.id as newQuoteNotifications')
			.join('quotes', 'quotes.id', 'quote_notifications.quotes_id')
			.where({ 'quotes.user_name': username, 'quote_notifications.read': 0 });
		const newFavoriteNotificationsCount = await trx('favorite_notifications').count('favorite_notifications.id as newFavoriteNotifications').where({ 'favorite_notifications.to_user': username, 'favorite_notifications.read': 0 });
		res.json({ notificationCount: (newQuoteNotificationsCount[0] as any)['newQuoteNotifications'] + (newFavoriteNotificationsCount[0] as any)['newFavoriteNotifications'] });
		await trx.commit();
	} catch (error) {
		await trx.rollback();
		res.sendStatus(400);
	}
};

export { getNotificationCount };
