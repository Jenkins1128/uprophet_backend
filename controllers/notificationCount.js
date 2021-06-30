const getNotificationCount = async (req, res, db, jwt, refreshToken) => {
	const trx = await db.transaction();
	try {
		const { username } = await refreshToken(req, res, jwt, db);
		//Add notification count
		const newLikeNotificationsCount = await trx('quote_notifications')
			.count('quote_notifications.id as newLikeNotifications')
			.join('quotes', 'quotes.id', 'quote_notifications.quotes_id')
			.where({ 'quotes.user_name': username, 'quote_notifications.read': 0 });
		const newFavoriteNotificationsCount = await trx('favorite_notifications').count('favorite_notifications.id as newFavoriteNotifications').where({ 'favorite_notifications.to_user': username, 'favorite_notifications.read': 0 });
		res.json({ notificationCount: newLikeNotificationsCount[0]['newLikeNotifications'] + newFavoriteNotificationsCount[0]['newFavoriteNotifications'] });
		console.log({ notificationCount: newLikeNotificationsCount[0]['newLikeNotifications'] + newFavoriteNotificationsCount[0]['newFavoriteNotifications'] });
		await trx.commit();
	} catch (error) {
		await trx.rollback();
		res.sendStatus(400);
	}
};

module.exports = { getNotificationCount };
