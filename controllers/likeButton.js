const likeQuote = async (req, res, db, jwt, accessTokenPayload) => {
	const { quoteId } = req.body;
	const trx = await db.transaction();
	try {
		//get username, id from access token
		const { id, username } = await accessTokenPayload(req, res, jwt, db);
		await trx('likes').insert({
			users_id: id,
			quotes_id: quoteId
		});
		await trx('quote_notifications').insert({
			notice: `${username} liked your quote.`,
			quotes_id: quoteId,
			date: process.env.NODE_ENV === 'production' 
				? new Date().toISOString().replace('T', ' ').substr(0, 19)
				: new Date().toLocaleString('sv-SE').slice(0, 19)
		});
		res.sendStatus(200);
		await trx.commit();
	} catch (error) {
		await trx.rollback();
		res.sendStatus(400);
	}
};

const unlikeQuote = async (req, res, db, jwt, accessTokenPayload) => {
	const { quoteId } = req.body;
	try {
		//get username, id from access token
		const { id } = await accessTokenPayload(req, res, jwt, db);
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
