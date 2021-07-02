const favoriteUser = async (req, res, db, jwt, refreshToken) => {
	const { toUser } = req.body;

	const trx = await db.transaction();
	try {
		const { username } = await refreshToken(req, res, jwt, db);

		await trx('favoriting').insert({
			from_user: username,
			to_user: toUser
		});
		await trx('favorite_notifications').insert({
			notice: `${username} favorited you.`,
			to_user: toUser
		});
		res.sendStatus(200);
		await trx.commit();
	} catch (error) {
		await trx.rollback();
		res.status(400).json(error.toString());
	}
};

const unfavoriteUser = async (req, res, db, jwt, refreshToken) => {
	const { toUser } = req.body;

	try {
		const { username } = await refreshToken(req, res, jwt, db);
		await db('favoriting')
			.where({
				from_user: username,
				to_user: toUser
			})
			.del();
		res.sendStatus(200);
	} catch {
		res.sendStatus(400);
	}
};

module.exports = { favoriteUser, unfavoriteUser };
