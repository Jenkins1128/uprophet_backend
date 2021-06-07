const likeQuote = (req, res, db) => {
	const { userId, quoteId } = req.body;

	db.insert({
		users_id: userId,
		quotes_id: quoteId
	})
		.into('likes')
		.then(() => res.sendStatus(200))
		.catch(() => res.sendStatus(400));
};

const unlikeQuote = (req, res, db) => {
	const { userId, quoteId } = req.body;

	db('likes')
		.where({
			users_id: userId,
			quotes_id: quoteId
		})
		.del()
		.then(() => res.sendStatus(200))
		.catch(() => res.sendStatus(400));
};

module.exports = { likeQuote, unlikeQuote };
