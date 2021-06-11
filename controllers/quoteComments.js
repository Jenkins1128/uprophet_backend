const fetchComments = async (req, res, db) => {
	const { quoteId } = req.params;
	try {
		const commentDetails = await db('comments').select('*').where('quotes_id', quoteId);
		res.json(commentDetails);
	} catch (error) {
		res.sendStatus(400);
	}
};

const addComment = async (req, res, db) => {
	const { quoteId, comment, commenter } = req.body;
	const trx = await db.transaction();
	try {
		await trx('comments').insert({
			quotes_id: quoteId,
			comment: comment,
			commenter: commenter
		});
		await trx('notifications').insert({
			user_name: commenter,
			notice: `${commenter} commented on your quote.`,
			quotes_id: quoteId
		});
		res.sendStatus(200);
		await trx.commit();
	} catch {
		await trx.rollback();
		res.sendStatus(400);
	}
};

module.exports = { fetchComments, addComment };
