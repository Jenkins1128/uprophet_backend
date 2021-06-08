const fetchHome = (req, res, db, zlib) => {
	const { id, userName } = req.body;

	db.transaction((trx) => {
		let maxIds = [];
		let allUsers = [];
		trx.select('to_user')
			.from('favoriting')
			.where('from_user', userName)
			.then((users) => {
				allUsers = users.map((user) => user.to_user);
				maxIds = trx.max('id').from('quotes').whereIn('user_name', allUsers).groupBy('user_name');
				return trx.select('*').from('quotes').whereIn('id', maxIds);
			})
			.then((quotes) => {
				return trx
					.count('quotes_id')
					.from('likes')
					.whereIn('quotes_id', maxIds)
					.groupBy('quotes_id')
					.then((likeCountsForQuotes) => {
						return likeCountsForQuotes.map((likeCountForQuote, i) => {
							return { ...quotes[i], likeCount: likeCountForQuote['count(`quotes_id`)'] };
						});
					});
			})
			.then((quotesWithLikeCount) => {
				return trx
					.select('quotes_id')
					.from('likes')
					.where((builder) => builder.where('users_id', id).whereIn('quotes_id', maxIds))
					.groupBy('quotes_id')
					.then((quoteIds) => {
						const quoteIdSet = new Set();
						quoteIds.forEach((quoteId) => {
							quoteIdSet.add(quoteId['quotes_id']);
						});
						return quotesWithLikeCount.map((quoteWithLikeCount) => {
							return { ...quoteWithLikeCount, didLike: quoteIdSet.has(quoteWithLikeCount['id']) ? true : false };
						});
					});
			})
			.then((finalQuotes) => {
				return trx
					.select(['user_name', 'photo'])
					.from('users')
					.whereIn('user_name', allUsers)
					.then((photos) => {
						const idUserPhoto = {};
						photos.forEach((photo) => {
							const userPhoto = photo['photo'] ? photo['photo'].toString('base64') : undefined;
							idUserPhoto[photo['user_name']] = userPhoto;
						});
						finalQuotes.push(idUserPhoto);
						res.json(finalQuotes);
					});
			})
			.then(trx.commit)
			.catch(trx.rollback);
	}).catch((err) => res.status(400).json('unable to fetech quotes: ' + err));
};

const createQuote = (req, res, db) => {
	const { userName, title, quote, datePosted } = req.body;
	db.insert({
		user_name: userName,
		title: title,
		quote: quote,
		date_posted: datePosted
	})
		.into('quotes')
		.then(() => res.sendStatus(200))
		.catch(() => res.sendStatus(400));
};

module.exports = {
	fetchHome,
	createQuote
};
