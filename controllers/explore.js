const fetchExplore = async (req, res, db, jwt, refreshToken) => {
	const trx = await db.transaction();
	try {
		const { id } = await refreshToken(req, res, jwt, db);
		const randomQuoteIds = await trx('quotes').select('id').orderByRaw('RAND()').limit(20);
		const extractedQuoteIds = randomQuoteIds.map((id) => id['id']);
		const quotes = await trx('quotes').select('*').whereIn('id', extractedQuoteIds);

		//Get quotes with like count added
		const likeCountsForQuotes = await trx('likes').select('quotes_id').count('quotes_id as quoteLikeCount').whereIn('quotes_id', extractedQuoteIds).groupBy('quotes_id');
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
			.where((builder) => builder.where('users_id', id).whereIn('quotes_id', extractedQuoteIds))
			.groupBy('quotes_id');
		console.log(quoteIds);
		const quoteIdSet = new Set();
		quoteIds.forEach((quoteId) => {
			quoteIdSet.add(quoteId['quotes_id']);
		});
		const finalQuotes = quotesWithLikeCount.map((quoteWithLikeCount) => {
			return { ...quoteWithLikeCount, didLike: quoteIdSet.has(quoteWithLikeCount['id']) ? true : false };
		});
		res.json(finalQuotes);
		await trx.commit();
	} catch (error) {
		await trx.rollback();
		res.status(400).json(error.toString());
	}
};

module.exports = {
	fetchExplore
};
