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

	try {
		await db('comments').insert({
			quotes_id: quoteId,
			comment: comment,
			commenter: commenter
		});
		res.sendStatus(200);
	} catch (error) {
		res.sendStatus(400);
	}
};

module.exports = { fetchComments, addComment };
