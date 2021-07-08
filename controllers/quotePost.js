const getQuotePost = async (req, res, db, jwt, accessTokenPayload) => {
	const { quoteId } = req.body;
	const trx = await db.transaction();
	try {
		const { id } = await accessTokenPayload(req, res, jwt, db);
		const quotePost = await trx('quotes').select('*').where('id', quoteId);
		const likeCount = await trx('likes').count('users_id as likeCount').where('quotes_id', quoteId);
		const didLike = await trx('likes').select('users_id').where('users_id', id).where('quotes_id', quoteId);
		res.json({ ...quotePost[0], likeCount: likeCount[0].likeCount, didLike: didLike.length ? true : false });
		trx.commit();
	} catch (error) {
		trx.rollback();
		res.sendStatus(400);
	}
};

const deleteQuotePost = async (req, res, db) => {
	const { quoteId } = req.body;
	try {
		await db('quotes').del().where('id', quoteId);
		res.sendStatus(200);
	} catch {
		res.sendStatus(400);
	}
};

module.exports = { getQuotePost, deleteQuotePost };
