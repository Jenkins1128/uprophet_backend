import { Request, Response } from 'express';
import { Knex } from 'knex';
import { JwtModule, AccessTokenPayloadFn } from '../types';

const fetchNotifications = async (req: Request, res: Response, db: Knex, jwt: JwtModule, accessTokenPayload: AccessTokenPayloadFn): Promise<void> => {
	const trx = await db.transaction();
	try {
		const { username } = await accessTokenPayload(req, res, jwt, db);
		const quoteNotifications = await trx('quote_notifications')
			.select('quote_notifications.id', 'quote_notifications.notice', 'quote_notifications.quotes_id', 'quote_notifications.date', 'quotes.user_name')
			.join('quotes', 'quotes.id', 'quote_notifications.quotes_id')
			.where('quotes.user_name', username)
			.orderBy('quote_notifications.id', 'desc')
			.limit(10);
		await trx('quote_notifications').update('read', 1).join('quotes', 'quotes.id', 'quote_notifications.quotes_id').where({ 'quotes.user_name': username, 'quote_notifications.read': 0 });
		const favoriteNotifications = await trx('favorite_notifications').select('id', 'notice', 'to_user', 'date').where('to_user', username).orderBy('id', 'desc').limit(10);
		await trx('favorite_notifications').update('read', 1).where('to_user', username);
		const allNotifications: any[] = quoteNotifications;
		favoriteNotifications.forEach((obj: any) => {
			allNotifications.push(obj);
		});
		allNotifications.sort((a: any, b: any) => b.date - a.date);
		res.json(allNotifications);
		await trx.commit();
	} catch (error) {
		await trx.rollback();
		res.sendStatus(400);
	}
};

export { fetchNotifications };
