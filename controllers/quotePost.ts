import { Request, Response } from 'express';
import { Knex } from 'knex';
import { JwtModule, AccessTokenPayloadFn } from '../types';

const getQuotePost = async (req: Request, res: Response, db: Knex, jwt: JwtModule, accessTokenPayload: AccessTokenPayloadFn): Promise<void> => {
	const { quoteId } = req.body;
	const trx = await db.transaction();
	try {
		const { id } = await accessTokenPayload(req, res, jwt, db);
		const quotePost = await trx('quotes').select('*').where('id', quoteId);
		const likeCount = await trx('likes').count('users_id as likeCount').where('quotes_id', quoteId);
		const didLike = await trx('likes').select('users_id').where('users_id', id).where('quotes_id', quoteId);
		res.json({ ...quotePost[0], likeCount: (likeCount[0] as any).likeCount, didLike: didLike.length ? true : false });
		trx.commit();
	} catch (error) {
		trx.rollback();
		res.sendStatus(400);
	}
};

const deleteQuotePost = async (req: Request, res: Response, db: Knex): Promise<void> => {
	const { quoteId } = req.body;
	try {
		await db('quotes').del().where('id', quoteId);
		res.sendStatus(200);
	} catch {
		res.sendStatus(400);
	}
};

export { getQuotePost, deleteQuotePost };
