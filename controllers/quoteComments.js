const fetchComments = (req, res, db) => {
	const { quoteId } = req.params;
	db.select('*')
		.from('comments')
		.where('quotes_id', quoteId)
		.then((commentDetails) => res.json(commentDetails))
		.catch(() => res.sendStatus(400));
};

const addComment = (req, res, db) => {
	const { quoteId, comment, commenter } = req.body;
	db.insert({
		quotes_id: quoteId,
		comment: comment,
		commenter: commenter
	})
		.into('comments')
		.then(() => res.sendStatus(200))
		.catch(() => res.sendStatus(400));
};

module.exports = { fetchComments, addComment };
