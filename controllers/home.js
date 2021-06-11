const fetchHome = async (req, res, db) => {
	const { id, userName } = req.body;

	const trx = await db.transaction();
	try {
		//Get the latest quote from each user you are following
		const users = await trx('favoriting').select('to_user').where('from_user', userName);
		const allUsers = users.map((user) => user.to_user);
		const maxIds = await trx('quotes').max('id as maxId').whereIn('user_name', allUsers).groupBy('user_name');
		const extractedMaxIds = maxIds.map((maxId) => maxId['maxId']);
		const quotes = await trx('quotes').select('*').whereIn('id', extractedMaxIds);
		//Get quotes with like count added
		const likeCountsForQuotes = await trx('likes').count('quotes_id as quoteLikeCount').whereIn('quotes_id', extractedMaxIds).groupBy('quotes_id');
		const quotesWithLikeCount = likeCountsForQuotes.map((likeCountForQuote, i) => {
			return { ...quotes[i], likeCount: likeCountForQuote['quoteLikeCount'] };
		});
		//Add didLike to each quote
		const quoteIds = await trx('likes')
			.select('quotes_id')
			.where((builder) => builder.where('users_id', id).whereIn('quotes_id', extractedMaxIds))
			.groupBy('quotes_id');
		const quoteIdSet = new Set();
		quoteIds.forEach((quoteId) => {
			quoteIdSet.add(quoteId['quotes_id']);
		});
		const finalQuotes = quotesWithLikeCount.map((quoteWithLikeCount) => {
			return { ...quoteWithLikeCount, didLike: quoteIdSet.has(quoteWithLikeCount['id']) ? true : false };
		});
		//Add notification count
		const newNotificationsCount = await trx('notifications').count('notifications.id as newNotifications').join('quotes', 'quotes.id', 'notifications.quotes_id').where({ 'quotes.user_name': userName, 'notifications.read': 0 });
		finalQuotes.push(newNotificationsCount[0]);
		res.json(finalQuotes);
		await trx.commit();
	} catch (error) {
		await trx.rollback();
		res.status(400).json('unable to fetech quotes: ' + error);
	}
};

const createQuote = async (req, res, db) => {
	const { userName, title, quote, datePosted } = req.body;

	try {
		const quoteId = await db('quotes').insert({
			user_name: userName,
			title: title,
			quote: quote,
			date_posted: datePosted
		});

		res.status(200).json(quoteId[0]);
	} catch {
		res.sendStatus(400);
	}
};

module.exports = {
	fetchHome,
	createQuote
};
