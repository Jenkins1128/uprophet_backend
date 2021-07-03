const fetchFavoriting = async (req, res, db, jwt, refreshToken) => {
	const { username } = req.body;
	const fromUser = username;
	const trx = await db.transaction();
	try {
		const { username } = await refreshToken(req, res, jwt, db);
		const allFavoriting = await trx('favoriting').select('to_user').where('from_user', fromUser);
		const resultUsers = allFavoriting.map((result) => result.to_user);
		console.log(resultUsers);
		//Add didFavortie to each user
		const usersFavoriting = await trx('favoriting')
			.select('to_user')
			.where((builder) => builder.where('from_user', username).whereIn('to_user', resultUsers));
		const usersSet = new Set();
		usersFavoriting.forEach((user) => {
			usersSet.add(user['to_user']);
		});
		const finalResultUsers = allFavoriting.map((user) => {
			return { ...user, currentUser: username, didFavorite: usersSet.has(user['to_user']) ? true : false };
		});

		console.log('finalUsers', finalResultUsers);
		res.json(finalResultUsers);
		await trx.commit();
	} catch {
		await trx.rollback();
		res.sendStatus(400);
	}
};

module.exports = { fetchFavoriting };
