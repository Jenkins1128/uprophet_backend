const getQuotePost = async (req, res, db, jwt, refreshToken) => {
	const { quoteId } = req.body;
	const trx = await db.transaction();
	try {
		const { id } = await refreshToken(req, res, jwt, db);
		const quotePost = await trx('quotes').select('*').where('id', quoteId);
		const likeCount = await trx('likes').count('users_id as likeCount').where('quotes_id', quoteId);
		const didLike = await trx('likes').select('users_id').where('users_id', id).where('quotes_id', quoteId);
		console.log(didLike);
		res.json({ ...quotePost[0], likeCount: likeCount[0].likeCount, didLike: didLike.length ? true : false });
		trx.commit();
	} catch (error) {
		trx.rollback();
		res.sendStatus(400);
	}
};

module.exports = { getQuotePost };
