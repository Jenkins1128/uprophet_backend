const unlikeQuote = (req, res, db) => {
	const { userId, quoteId } = req.body;

	db('likes')
		.where({
			users_id: userId,
			quotes_id: quoteId
		})
		.del()
		.then(() => res.sendStatus(200))
		.catch(() => res.status(400).json('No connection'));
};

module.exports = { unlikeQuote };
