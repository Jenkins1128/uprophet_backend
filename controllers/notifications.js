const fetchNotifications = async (req, res, db, jwt, refreshToken) => {
	const trx = await db.transaction();
	try {
		const { username } = await refreshToken(req, res, jwt, db);
		const likeNotifications = await trx('quote_notifications').select('*').join('quotes', 'quotes.id', 'quote_notifications.quotes_id').where('quotes.user_name', username).orderBy('quote_notifications.id', 'desc').limit(20);
		//await trx('quote_notifications').update('read', 1).join('quotes', 'quotes.id', 'quote_notifications.quotes_id').where({ 'quotes.user_name': username, 'quote_notifications.read': 0 });
		const favoriteNotifications = await trx('favorite_notifications').select('*').where('to_user', username);
		//await trx('favorite_notifications').update('read', 1).where('to_user', username);
		const allNotifications = likeNotifications;
		favoriteNotifications.forEach((obj) => {
			allNotifications.push(obj);
		});
		console.log('allNotifications', allNotifications);
		res.json(allNotifications);
		trx.commit();
	} catch (error) {
		trx.rollback();
		res.sendStatus(400);
	}
};

module.exports = { fetchNotifications };
