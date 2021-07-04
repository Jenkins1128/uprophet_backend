const fetchProfileQuotes = async (req, res, db, jwt, refreshToken) => {
	const { username } = req.body;

	const trx = await db.transaction();
	try {
		const { id } = await refreshToken(req, res, jwt, db);

		//Get the latest quote from each user you are following
		const userQuoteIds = await trx('quotes').select('id').where('user_name', username);
		const extractedUserQuoteIds = userQuoteIds.map((userQuoteId) => userQuoteId['id']);
		const quotes = await trx('quotes').select('*').whereIn('id', extractedUserQuoteIds).orderBy('id', 'desc');
		//Get quotes with like count added
		const likeCountsForQuotes = await trx('likes').select('quotes_id').count('quotes_id as quoteLikeCount').whereIn('quotes_id', extractedUserQuoteIds).groupBy('quotes_id');
		const likeCountsForQuotesMap = new Map();
		likeCountsForQuotes.forEach((likeCount) => {
			likeCountsForQuotesMap.set(likeCount['quotes_id'], likeCount['quoteLikeCount']);
		});
		const quotesWithLikeCount = quotes.map((quote) => {
			const quoteLikeCount = likeCountsForQuotesMap.has(quote['id']) ? likeCountsForQuotesMap.get(quote['id']) : 0;
			return { ...quote, likeCount: quoteLikeCount };
		});
		//Add didLike to each quote
		const quoteIds = await trx('likes')
			.select('quotes_id')
			.where((builder) => builder.where('users_id', id).whereIn('quotes_id', extractedUserQuoteIds))
			.groupBy('quotes_id');
		const quoteIdSet = new Set();
		quoteIds.forEach((quoteId) => {
			quoteIdSet.add(quoteId['quotes_id']);
		});
		const finalQuotes = quotesWithLikeCount.map((quoteWithLikeCount) => {
			return { ...quoteWithLikeCount, didLike: quoteIdSet.has(quoteWithLikeCount['id']) ? true : false };
		});
		//console.log(finalQuotes);
		res.json(finalQuotes);
		await trx.commit();
	} catch (error) {
		await trx.rollback();
		res.status(400).json('unable to fetech quotes: ' + error);
	}
};

const getUserInfo = async (req, res, db, jwt, refreshToken) => {
	const { username } = req.body;
	const profileUser = username;
	const trx = await db.transaction();
	console.log('profileUser', profileUser);
	try {
		const { username } = await refreshToken(req, res, jwt, db);
		console.log('currentUser', username);
		//favoriters, favoriting cound
		const favoriters = await trx('favoriting').count('to_user as favoriters').where('to_user', profileUser);
		const favoriting = await trx('favoriting').count('from_user as favoriting').where('from_user', profileUser);
		const favoritingCounts = {
			favoriters: favoriters.length ? favoriters[0]['favoriters'] : 0,
			favoriting: favoriting.length ? favoriting[0]['favoriting'] : 0
		};
		console.log('favoritingCounts', favoritingCounts);
		//Add didFavortie to each user
		const userFavoriting = await trx('favoriting')
			.select('to_user')
			.where((builder) => builder.where('from_user', username).where('to_user', profileUser));
		console.log('userFavoriting', userFavoriting);
		const didFavorite = userFavoriting.length ? true : false;

		//bio
		const bio = await trx('users').select('bio').where('user_name', profileUser);
		console.log(bio);

		const userInfo = { currentUser: username, didFavorite: didFavorite, favoriters: favoritingCounts.favoriters, favoriting: favoritingCounts.favoriting, bio: bio[0].bio };

		console.log('userInfo', userInfo);
		res.json(userInfo);
		await trx.commit();
	} catch {
		await trx.rollback();
		res.sendStatus(400);
	}
};

const getCurrentUserInfo = async (req, res, db, jwt, refreshToken) => {
	try {
		const { username } = await refreshToken(req, res, jwt, db);
		//bio
		const bio = await db('users').select('bio').where('user_name', username);
		console.log(bio);
		const userInfo = { currentUser: username, bio: bio[0].bio };
		console.log(userInfo);
		res.json(userInfo);
	} catch {
		res.sendStatus(400);
	}
};

module.exports = { fetchProfileQuotes, getUserInfo, getCurrentUserInfo };
