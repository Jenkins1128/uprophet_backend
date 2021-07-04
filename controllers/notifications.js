const fetchNotifications = async (req, res, db, jwt, refreshToken) => {
	const trx = await db.transaction();
	try {
		const { username } = await refreshToken(req, res, jwt, db);
		const quoteNotifications = await trx('quote_notifications')
			.select('quote_notifications.id', 'quote_notifications.notice', 'quote_notifications.quotes_id', 'quote_notifications.date', 'quotes.user_name')
			.join('quotes', 'quotes.id', 'quote_notifications.quotes_id')
			.where('quotes.user_name', username)
			.orderBy('quote_notifications.id', 'desc')
			.limit(10);
		await trx('quote_notifications').update('read', 1).join('quotes', 'quotes.id', 'quote_notifications.quotes_id').where({ 'quotes.user_name': username, 'quote_notifications.read': 0 });
		const favoriteNotifications = await trx('favorite_notifications').select('id', 'notice', 'to_user', 'date').where('to_user', username).orderBy('id', 'desc').limit(10);
		await trx('favorite_notifications').update('read', 1).where('to_user', username);
		const allNotifications = quoteNotifications;
		favoriteNotifications.forEach((obj) => {
			allNotifications.push(obj);
		});
		allNotifications.sort((a, b) => b.date - a.date);
		console.log('allNotifications', allNotifications);
		res.json(allNotifications);
		await trx.commit();
	} catch (error) {
		await trx.rollback();
		res.sendStatus(400);
	}
};

module.exports = { fetchNotifications };
