const fetchHome = async (req, res, db, jwt, refreshToken) => {
	//const { id, userName } = req.body;

	const trx = await db.transaction();
	try {
		//get user from access token
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

const createQuote = async (req, res, db, jwt, refreshToken) => {
	const { title, quote } = req.body;
	console.log(title, quote);
	const trx = await db.transaction();
	try {
		//get user from access token
		const { username } = await refreshToken(req, res, jwt, db);
		console.log(username);

		const quoteId = await trx('quotes').insert({
			user_name: username,
			title: title,
			quote: quote,
			date_posted: new Date().toISOString().replace('T', ' ').substr(0, 19)
		});
		console.log(quoteId[0]);
		const extractedQuote = await trx('quotes').select('*').where('id', quoteId[0]);
		console.log(extractedQuote);
		const finalQuote = { ...extractedQuote[0], likeCount: 0, didLike: false };
		console.log(finalQuote);
		res.json(finalQuote);
		await trx.commit();
	} catch {
		await trx.rollback();
		res.sendStatus(400);
	}
};

module.exports = {
	fetchHome,
	createQuote
};
