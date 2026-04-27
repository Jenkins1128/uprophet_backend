import { Request, Response } from 'express';
import { Knex } from 'knex';
import { JwtModule, AccessTokenPayloadFn } from '../types';

const fetchProfileQuotes = async (req: Request, res: Response, db: Knex, jwt: JwtModule, accessTokenPayload: AccessTokenPayloadFn): Promise<void> => {
	const { username } = req.body;
	const trx = await db.transaction();
	try {
		const { id } = await accessTokenPayload(req, res, jwt, db);
		//Get the latest quote from each user you are following
		const userQuoteIds = await trx('quotes').select('id').where('user_name', username);
		const extractedUserQuoteIds = userQuoteIds.map((userQuoteId: any) => userQuoteId['id']);
		const quotes = await trx('quotes').select('*').whereIn('id', extractedUserQuoteIds).orderBy('id', 'desc');
		//Get quotes with like count added
		const likeCountsForQuotes = await trx('likes').select('quotes_id').count('quotes_id as quoteLikeCount').whereIn('quotes_id', extractedUserQuoteIds).groupBy('quotes_id');
		const likeCountsForQuotesMap = new Map<number, number>();
		likeCountsForQuotes.forEach((likeCount: any) => {
			likeCountsForQuotesMap.set(likeCount['quotes_id'], likeCount['quoteLikeCount']);
		});
		const quotesWithLikeCount = quotes.map((quote: any) => {
			const quoteLikeCount = likeCountsForQuotesMap.has(quote['id']) ? likeCountsForQuotesMap.get(quote['id']) : 0;
			return { ...quote, likeCount: quoteLikeCount };
		});
		//Add didLike to each quote
		const quoteIds = await trx('likes')
			.select('quotes_id')
			.where((builder: any) => builder.where('users_id', id).whereIn('quotes_id', extractedUserQuoteIds))
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
	} catch (error) {
		await trx.rollback();
		res.sendStatus(400);
	}
};

const getUserInfo = async (req: Request, res: Response, db: Knex, jwt: JwtModule, accessTokenPayload: AccessTokenPayloadFn): Promise<void> => {
	const { username } = req.body;
	const profileUser = username;
	const trx = await db.transaction();
	try {
		const { username } = await accessTokenPayload(req, res, jwt, db);
		//favoriters, favoriting counts
		const favoriters = await trx('favoriting').count('to_user as favoriters').where('to_user', profileUser);
		const favoriting = await trx('favoriting').count('from_user as favoriting').where('from_user', profileUser);
		const favoritingCounts = {
			favoriters: favoriters.length ? (favoriters[0] as any)['favoriters'] : 0,
			favoriting: favoriting.length ? (favoriting[0] as any)['favoriting'] : 0
		};
		//Add didFavortie to each user
		const userFavoriting = await trx('favoriting')
			.select('to_user')
			.where((builder: any) => builder.where('from_user', username).where('to_user', profileUser));
		const didFavorite = userFavoriting.length ? true : false;
		//bio
		const bio = await trx('users').select('bio').where('user_name', profileUser);
		//userInfo
		const userInfo = { currentUser: username, didFavorite: didFavorite, favoriters: favoritingCounts.favoriters, favoriting: favoritingCounts.favoriting, bio: (bio[0] as any).bio };
		res.json(userInfo);
		await trx.commit();
	} catch {
		await trx.rollback();
		res.sendStatus(400);
	}
};

const getCurrentUserInfo = async (req: Request, res: Response, db: Knex, jwt: JwtModule, accessTokenPayload: AccessTokenPayloadFn): Promise<void> => {
	try {
		const { username } = await accessTokenPayload(req, res, jwt, db);
		//bio
		const bio = await db('users').select('bio').where('user_name', username);
		const userInfo = { currentUser: username, bio: (bio[0] as any).bio };
		res.json(userInfo);
	} catch {
		res.sendStatus(400);
	}
};

export { fetchProfileQuotes, getUserInfo, getCurrentUserInfo };
