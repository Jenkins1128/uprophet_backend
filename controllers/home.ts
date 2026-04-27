import { Request, Response } from 'express';
import { Knex } from 'knex';
import { JwtModule, AccessTokenPayloadFn } from '../types';

const fetchHome = async (req: Request, res: Response, db: Knex, jwt: JwtModule, accessTokenPayload: AccessTokenPayloadFn): Promise<void> => {
	const trx = await db.transaction();
	try {
		//get user from access token
		const { id, username } = await accessTokenPayload(req, res, jwt, db);
		//Get the latest quote from each user you are following
		const users = await trx('favoriting').select('to_user').where('from_user', username);
		const allUsers = users.map((user: any) => user.to_user);
		allUsers.push(username);
		const maxIds = await trx('quotes').max('id as maxId').whereIn('user_name', allUsers).groupBy('user_name');
		const extractedMaxIds = maxIds.map((maxId: any) => maxId['maxId']);
		const quotes = await trx('quotes').select('*').whereIn('id', extractedMaxIds);
		//Get quotes with like count added
		const likeCountsForQuotes = await trx('likes').select('quotes_id').count('quotes_id as quoteLikeCount').whereIn('quotes_id', extractedMaxIds).groupBy('quotes_id');
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
			.where((builder: any) => builder.where('users_id', id).whereIn('quotes_id', extractedMaxIds))
			.groupBy('quotes_id');
		const quoteIdSet = new Set<number>();
		quoteIds.forEach((quoteId: any) => {
			quoteIdSet.add(quoteId['quotes_id']);
		});
		const finalQuotes = quotesWithLikeCount.map((quoteWithLikeCount: any) => {
			return { ...quoteWithLikeCount, didLike: quoteIdSet.has(quoteWithLikeCount['id']) ? true : false };
		});
		finalQuotes.sort((a: any, b: any) => b.date_posted - a.date_posted);
		res.json(finalQuotes);
		await trx.commit();
	} catch (error) {
		await trx.rollback();
		res.sendStatus(400);
	}
};

const createQuote = async (req: Request, res: Response, db: Knex, jwt: JwtModule, accessTokenPayload: AccessTokenPayloadFn): Promise<void> => {
	const { title, quote } = req.body;
	const trx = await db.transaction();
	try {
		//get user from access token
		const { username } = await accessTokenPayload(req, res, jwt, db);
		const quoteId = await trx('quotes').insert({
			user_name: username,
			title: title,
			quote: quote,
			date_posted: process.env.NODE_ENV === 'production' 
				? new Date().toISOString().replace('T', ' ').substr(0, 19)
				: new Date().toLocaleString('sv-SE').slice(0, 19)
		});
		const extractedQuote = await trx('quotes').select('*').where('id', quoteId[0]);
		const finalQuote = { ...extractedQuote[0], likeCount: 0, didLike: false };
		res.json(finalQuote);
		await trx.commit();
	} catch {
		await trx.rollback();
		res.sendStatus(400);
	}
};

export {
	fetchHome,
	createQuote
};
