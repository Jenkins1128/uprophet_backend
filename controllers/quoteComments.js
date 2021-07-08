const fetchComments = async (req, res, db) => {
	const { quoteId } = req.body;
	try {
		const commentDetails = await db('comments').select('*').where('quotes_id', quoteId);
		commentDetails.sort((a, b) => b.date_posted - a.date_posted);
		res.json(commentDetails);
	} catch (error) {
		res.sendStatus(400);
	}
};

const addComment = async (req, res, db, jwt, accessTokenPayload) => {
	const { quoteId, comment } = req.body;
	const trx = await db.transaction();
	const date = new Date().toISOString().replace('T', ' ').substr(0, 19);
	try {
		const { username } = await accessTokenPayload(req, res, jwt, db);
		const commentId = await trx('comments').insert({
			quotes_id: quoteId,
			comment: comment,
			commenter: username,
			date_posted: date
		});
		await trx('quote_notifications').insert({
			notice: `${username} commented on your quote.`,
			quotes_id: quoteId,
			date: date
		});
		const addedComment = await trx('comments').select('*').where('id', commentId[0]);
		res.json({ ...addedComment[0] });
		await trx.commit();
	} catch {
		await trx.rollback();
		res.sendStatus(400);
	}
};

module.exports = { fetchComments, addComment };
