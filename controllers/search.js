const getSearchResults = async (req, res, db, jwt, refreshToken) => {
	const { search } = req.body;

	const trx = await db.transaction();
	try {
		const { username } = await refreshToken(req, res, jwt, db);
		const results = await trx('users').select('id', 'user_name').where('user_name', 'like', `%${search}%`).limit(15);
		const resultUsers = results.map((result) => result.user_name);

		//Add didFavortie to each user
		const usersFavoriting = await trx('favoriting')
			.select('to_user')
			.where((builder) => builder.where('from_user', username).whereIn('to_user', resultUsers));
		const usersSet = new Set();
		usersFavoriting.forEach((user) => {
			usersSet.add(user['to_user']);
		});
		const finalResultUsers = results.map((user) => {
			return { ...user, didFavorite: usersSet.has(user['user_name']) ? true : false };
		});
		res.json(finalResultUsers);
		await trx.commit();
	} catch {
		await trx.rollback();
		res.sendStatus(400);
	}
};

module.exports = { getSearchResults };
