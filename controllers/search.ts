import { Request, Response } from 'express';
import { Knex } from 'knex';
import { JwtModule, AccessTokenPayloadFn } from '../types';

const getSearchResults = async (req: Request, res: Response, db: Knex, jwt: JwtModule, accessTokenPayload: AccessTokenPayloadFn): Promise<void> => {
	const { search } = req.body;
	const trx = await db.transaction();
	try {
		const { username } = await accessTokenPayload(req, res, jwt, db);
		const results = await trx('users').select('id', 'user_name').where('user_name', 'like', `%${search}%`).limit(15);
		const resultUsers = results.map((result: any) => result.user_name);
		//Add didFavortie to each user
		const usersFavoriting = await trx('favoriting')
			.select('to_user')
			.where((builder: any) => builder.where('from_user', username).whereIn('to_user', resultUsers));
		const usersSet = new Set<string>();
		usersFavoriting.forEach((user: any) => {
			usersSet.add(user['to_user']);
		});
		const finalResultUsers = results.map((user: any) => {
			return { ...user, currentUser: username, didFavorite: usersSet.has(user['user_name']) ? true : false };
		});
		res.json(finalResultUsers);
		await trx.commit();
	} catch {
		await trx.rollback();
		res.sendStatus(400);
	}
};

export { getSearchResults };
