const fetchFavoriters = async (req, res, db, jwt, refreshToken) => {
	const { username } = req.body;
	const toUser = username;
	const trx = await db.transaction();
	try {
		const { username } = await refreshToken(req, res, jwt, db);
		const allFavoriters = await trx('favoriting').select('from_user').where('to_user', toUser);
		const resultUsers = allFavoriters.map((result) => result.from_user);
		console.log(resultUsers);
		//Add didFavortie to each user
		let finalUsers = [];
		if (resultUsers.length) {
			const usersFavoriting = await trx('favoriting')
				.select('to_user')
				.where((builder) => builder.where('from_user', username).whereIn('to_user', resultUsers));
			const usersSet = new Set();
			usersFavoriting.forEach((user) => {
				usersSet.add(user['to_user']);
			});
			const finalResultUsers = allFavoriters.map((user) => {
				return { ...user, didFavorite: usersSet.has(user['to_user']) ? true : false };
			});
			finalUsers = finalResultUsers;
		}
		console.log(finalUsers);
		res.json(finalUsers);
		await trx.commit();
	} catch {
		await trx.rollback();
		res.sendStatus(400);
	}
};

module.exports = { fetchFavoriters };
