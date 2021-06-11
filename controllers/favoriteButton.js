const favoriteUser = async (req, res, db) => {
	const { fromUser, toUser } = req.body;

	const trx = await db.transaction();
	try {
		await trx('favoriting').insert({
			from_user: fromUser,
			to_user: toUser
		});
		await trx('favorite_notifications').insert({
			notice: `${fromUser} favorited you.`,
			to_user: toUser
		});
		res.sendStatus(200);
		await trx.commit();
	} catch (error) {
		await trx.rollback();
		res.status(400).json(error.toString());
	}
};

const unfavoriteUser = async (req, res, db) => {
	const { fromUser, toUser } = req.body;

	try {
		await db('favoriting')
			.where({
				from_user: fromUser,
				to_user: toUser
			})
			.del();
		res.sendStatus(200);
	} catch {
		res.sendStatus(400);
	}
};

module.exports = { favoriteUser, unfavoriteUser };
