const fetchHome = async (req, res, db, jwt, refreshToken) => {
	//const { id, userName } = req.body;

	const trx = await db.transaction();
	try {
		//refresh token
		const { id, username } = await refreshToken(req, res, jwt, db);

		console.log(id + ' ' + username);
		//Get the latest quote from each user you are following
		const users = await trx('favoriting').select('to_user').where('from_user', username);
		const allUsers = users.map((user) => user.to_user);
		allUsers.push(username);
		const maxIds = await trx('quotes').max('id as maxId').whereIn('user_name', allUsers).groupBy('user_name');
		const extractedMaxIds = maxIds.map((maxId) => maxId['maxId']);
		const quotes = await trx('quotes').select('*').whereIn('id', extractedMaxIds);
		//Get quotes with like count added
		const likeCountsForQuotes = await trx('likes').select('quotes_id').count('quotes_id as quoteLikeCount').whereIn('quotes_id', extractedMaxIds).groupBy('quotes_id');
		const likeCountsForQuotesMap = new Map();
		likeCountsForQuotes.forEach((likeCount) => {
			likeCountsForQuotesMap.set(likeCount['quotes_id'], likeCount['quoteLikeCount']);
		});
		const quotesWithLikeCount = quotes.map((quote) => {
			return { ...quote, likeCount: likeCountsForQuotesMap.has(quote['id']) ? likeCountsForQuotesMap.get(quote['id']) : 0 };
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
		const newLikeNotificationsCount = await trx('like_notifications')
			.count('like_notifications.id as newLikeNotifications')
			.join('quotes', 'quotes.id', 'like_notifications.quotes_id')
			.where({ 'quotes.user_name': username, 'like_notifications.read': 0 });
		const newFavoriteNotificationsCount = await trx('favorite_notifications').count('favorite_notifications.id as newFavoriteNotifications').where({ 'favorite_notifications.to_user': username, 'favorite_notifications.read': 0 });
		finalQuotes.push({ notificationCount: newLikeNotificationsCount[0]['newLikeNotifications'] + newFavoriteNotificationsCount[0]['newFavoriteNotifications'] });
		console.log(finalQuotes);
		res.json(finalQuotes);
		await trx.commit();
	} catch (error) {
		await trx.rollback();
		console.log('400 ' + error);
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
