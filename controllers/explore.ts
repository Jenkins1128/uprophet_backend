import { Request, Response } from 'express';
import { Knex } from 'knex';
import { JwtModule, AccessTokenPayloadFn } from '../types';

const fetchExplore = async (req: Request, res: Response, db: Knex, jwt: JwtModule, accessTokenPayload: AccessTokenPayloadFn): Promise<void> => {
	const trx = await db.transaction();
	try {
		const { id } = await accessTokenPayload(req, res, jwt, db);
		const randomQuoteIds = await trx('quotes').select('id').orderByRaw('RAND()').limit(20);
		const extractedQuoteIds = randomQuoteIds.map((id: any) => id['id']);
		const quotes = await trx('quotes').select('*').whereIn('id', extractedQuoteIds);
		//Get quotes with like count added
		const likeCountsForQuotes = await trx('likes').select('quotes_id').count('quotes_id as quoteLikeCount').whereIn('quotes_id', extractedQuoteIds).groupBy('quotes_id');
		const likeCountsForQuotesMap = new Map<number, number>();
		likeCountsForQuotes.forEach((likeCount: any) => {
			likeCountsForQuotesMap.set(likeCount['quotes_id'], likeCount['quoteLikeCount']);
		});
		const quotesWithLikeCount = quotes.map((quote: any) => {
			return { ...quote, likeCount: likeCountsForQuotesMap.has(quote['id']) ? likeCountsForQuotesMap.get(quote['id']) : 0 };
		});
		//Add didLike to each quote
		const quoteIds = await trx('likes')
			.select('quotes_id')
			.where((builder: any) => builder.where('users_id', id).whereIn('quotes_id', extractedQuoteIds))
			.groupBy('quotes_id');
		const quoteIdSet = new Set<number>();
		quoteIds.forEach((quoteId: any) => {
			quoteIdSet.add(quoteId['quotes_id']);
		});
		const finalQuotes = quotesWithLikeCount.map((quoteWithLikeCount: any) => {
			return { ...quoteWithLikeCount, didLike: quoteIdSet.has(quoteWithLikeCount['id']) ? true : false };
		});
		res.json(finalQuotes);
		await trx.commit();
	} catch {
		await trx.rollback();
		res.sendStatus(400);
	}
};

export {
	fetchExplore
};
