const fetchHome = (req, res, db) => {
	const { id, userName } = req.body;

	db.transaction((trx) => {
		let maxIds = [];
		trx.select('to_user')
			.from('favoriting')
			.where('from_user', userName)
			.then((users) => {
				const allUsers = users.map((users) => users.to_user);
				maxIds = trx.max('id').from('quotes').whereIn('user_name', allUsers).groupBy('user_name');
				return trx.select('*').from('quotes').whereIn('id', maxIds);
			})
			.then((quotes) => {
				return trx
					.count('quotes_id')
					.from('likes')
					.whereIn('quotes_id', maxIds)
					.groupBy('quotes_id')
					.then((likeCounts) => {
						return likeCounts.map((value, i) => {
							return { ...quotes[i], likeCount: value['count(`quotes_id`)'] };
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
						const finalQuotes = quotesWithLikeCount.map((value, i) => {
							return { ...quotesWithLikeCount[i], didLike: quoteIdSet.has(quotesWithLikeCount[i]['id']) ? true : false };
						});
						res.json(finalQuotes);
					});
			})
			.then(trx.commit)
			.catch(trx.rollback);
	}).catch((err) => res.status(400).json('unable to fetech quotes: ' + err));
};

const createQuote = (req, res, db) => {};

module.exports = {
	fetchHome,
	createQuote
};
