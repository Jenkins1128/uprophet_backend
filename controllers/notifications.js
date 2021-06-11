const fetchNotifications = async (req, res, db) => {
	const { userName } = req.body;

	const trx = await db.transaction();
	try {
		const notifications = await trx('notifications').select('*').join('quotes', 'quotes.id', 'notifications.quotes_id').where('quotes.user_name', userName).orderBy('notifications.id', 'desc').limit(20);
		await trx('notifications').update('read', 1).join('quotes', 'quotes.id', 'notifications.quotes_id').where({ 'quotes.user_name': userName, 'notifications.read': 0 });
		res.json(notifications);
		trx.commit();
	} catch (error) {
		trx.rollback();
		res.sendStatus(400);
	}
};

module.exports = { fetchNotifications };
