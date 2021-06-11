const likeQuote = async (req, res, db) => {
	const { userId, userName, quoteId } = req.body;
	console.log(userId, userName, quoteId);
	const trx = await db.transaction();
	try {
		await trx('likes').insert({
			users_id: userId,
			quotes_id: quoteId
		});
		await trx('notifications').insert({
			notice: `${userName} liked your quote.`,
			quotes_id: quoteId
		});
		res.sendStatus(200);
		await trx.commit();
	} catch (error) {
		await trx.rollback();
		res.status(400).json(error.toString());
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
