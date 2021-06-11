const fetchProfile = async (req, res, db) => {
	const { userName } = req.params;

	const trx = await db.transaction();
	try {
		//Get the latest quote from each user you are following
		const userQuoteIds = await trx('quotes').select('id').where('user_name', userName);
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
		const userId = await trx('users').select('id').where('user_name', userName);
		const quoteIds = await trx('likes')
			.select('quotes_id')
			.where((builder) => builder.where('users_id', userId).whereIn('quotes_id', extractedUserQuoteIds))
			.groupBy('quotes_id');
		const quoteIdSet = new Set();
		quoteIds.forEach((quoteId) => {
			quoteIdSet.add(quoteId['quotes_id']);
		});
		const finalQuotes = quotesWithLikeCount.map((quoteWithLikeCount) => {
			return { ...quoteWithLikeCount, didLike: quoteIdSet.has(quoteWithLikeCount['id']) ? true : false };
		});
		//Add favoriters and favoriting count to final quotes
		const favoriters = await trx('favoriting').count('to_user as favoriters').where('to_user', userName);
		const favoriting = await trx('favoriting').count('from_user as favoriting').where('from_user', userName);
		finalQuotes.push({
			favoriters: favoriters.length ? favoriters[0]['favoriters'] : 0,
			favoriting: favoriting.length ? favoriting[0]['favoriting'] : 0
		});
		res.json(finalQuotes);
		await trx.commit();
	} catch (error) {
		await trx.rollback();
		res.status(400).json('unable to fetech quotes: ' + error);
	}
};

module.exports = { fetchProfile };
