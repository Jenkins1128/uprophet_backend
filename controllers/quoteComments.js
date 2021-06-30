const fetchComments = async (req, res, db) => {
	const { quoteId } = req.body;
	try {
		const commentDetails = await db('comments').select('*').where('quotes_id', quoteId);
		res.json(commentDetails);
	} catch (error) {
		res.sendStatus(400);
	}
};

const addComment = async (req, res, db, jwt, refreshToken) => {
	const { quoteId, comment } = req.body;
	console.log(quoteId, comment);
	const trx = await db.transaction();
	const date = new Date().toISOString().replace('T', ' ').substr(0, 19);
	console.log('date', date);
	try {
		const { username } = await refreshToken(req, res, jwt, db);
		const commentId = await trx('comments').insert({
			quotes_id: quoteId,
			comment: comment,
			commenter: username,
			date_posted: date
		});
		console.log('Comment inserted');
		await trx('quote_notifications').insert({
			notice: `${username} commented on your quote.`,
			quotes_id: quoteId
		});
		console.log('Noti inserted');
		res.json({ id: commentId[0], quotes_id: quoteId, comment: comment, commenter: username, date_posted: date });
		await trx.commit();
	} catch {
		await trx.rollback();
		res.sendStatus(400);
	}
};

module.exports = { fetchComments, addComment };
