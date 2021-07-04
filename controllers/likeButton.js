const likeQuote = async (req, res, db, jwt, refreshToken) => {
	const { quoteId } = req.body;
	const trx = await db.transaction();
	try {
		//get username, id from access token
		const { id, username } = await refreshToken(req, res, jwt, db);

		await trx('likes').insert({
			users_id: id,
			quotes_id: quoteId
		});
		await trx('quote_notifications').insert({
			notice: `${username} liked your quote.`,
			quotes_id: quoteId,
			date: new Date().toISOString().replace('T', ' ').substr(0, 19)
		});
		console.log('id', id, 'like ', quoteId);
		res.sendStatus(200);
		await trx.commit();
	} catch (error) {
		await trx.rollback();
		res.status(400).json(error.toString());
	}
};

const unlikeQuote = async (req, res, db, jwt, refreshToken) => {
	const { quoteId } = req.body;

	try {
		//get username, id from access token
		const { id } = await refreshToken(req, res, jwt, db);
		console.log('id', id, 'unlike ', quoteId);
		await db('likes')
			.where({
				users_id: id,
				quotes_id: quoteId
			})
			.del();
		res.sendStatus(200);
	} catch {
		res.sendStatus(400);
	}
};

module.exports = { likeQuote, unlikeQuote };
