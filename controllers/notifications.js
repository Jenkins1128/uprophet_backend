const fetchNotifications = async (req, res, db) => {
	const { userName } = req.body;

	const trx = await db.transaction();
	try {
		const likeNotifications = await trx('like_notifications').select('*').join('quotes', 'quotes.id', 'like_notifications.quotes_id').where('quotes.user_name', userName).orderBy('like_notifications.id', 'desc').limit(20);
		await trx('like_notifications').update('read', 1).join('quotes', 'quotes.id', 'like_notifications.quotes_id').where({ 'quotes.user_name': userName, 'like_notifications.read': 0 });
		const favoriteNotifications = await trx('favorite_notifications').select('*').where('to_user', userName);
		await trx('favorite_notifications').update('read', 1).where('to_user', userName);
		const allNotifications = likeNotifications;
		favoriteNotifications.forEach((obj) => {
			allNotifications.push(obj);
		});
		res.json(allNotifications);
		trx.commit();
	} catch (error) {
		trx.rollback();
		res.status(400).json('errrr');
	}
};

module.exports = { fetchNotifications };
