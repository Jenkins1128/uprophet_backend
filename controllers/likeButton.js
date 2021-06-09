const likeQuote = async (req, res, db) => {
	const { userId, quoteId } = req.body;

	try {
		const likeId = await db('likes').insert({
			users_id: userId,
			quotes_id: quoteId
		});
		if (likeId.length) {
			res.sendStatus(200);
		}
	} catch {
		res.sendStatus(400);
	}
};

const unlikeQuote = async (req, res, db) => {
	const { userId, quoteId } = req.body;

	try {
		await db('likes')
			.where({
				users_id: userId,
				quotes_id: quoteId
			})
			.del();
		res.sendStatus(200);
	} catch {
		res.sendStatus(400);
	}
};

module.exports = { likeQuote, unlikeQuote };
