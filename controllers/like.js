const likeQuote = (req, res, db) => {
	const { userId, quoteId } = req.body;

	db.insert({
		users_id: userId,
		quotes_id: quoteId
	})
		.into('likes')
		.then(() => res.sendStatus(200))
		.catch(() => res.status(400).json('No connection'));
};

module.exports = { likeQuote };
