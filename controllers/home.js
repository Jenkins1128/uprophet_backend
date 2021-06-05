const fetchHome = (req, res, db) => {
	const { userName } = req.body;
	console.log(userName);
	db.transaction((trx) => {
		trx.select('to_user')
			.from('favoriting')
			.where('from_user', userName)
			.then((users) => {
				const allUsers = users.map((users) => users.to_user);
				console.log(allUsers);
				const maxIds = trx.max('id').from('quotes').whereIn('user_name', allUsers).groupBy('user_name');
				return trx
					.select('*')
					.from('quotes')
					.whereIn('id', maxIds)
					.then((data) => {
						console.log(data);
						if (data.length) {
							res.json(data);
						} else {
							res.status(400).json('No rows');
						}
					});
			})
			.then(trx.commit)
			.catch(trx.rollback);
	}).catch((err) => res.status(400).json('unable to fetech quotes: ' + err));
	// db.select('*')
	// 	.from('quotes')
	// 	.where('user_name', userName)
	// 	.then((data) => {
	// 		console.log(data);
	// 		if (data.length) {
	// 			res.json(data);
	// 		} else {
	// 			res.status(400).json('No rows');
	// 		}
	// 	})
	// 	.catch((err) => res.status(400).json('Not found'));
};

module.exports = {
	fetchHome
};
