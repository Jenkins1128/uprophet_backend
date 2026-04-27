import { Request, Response } from 'express';
import { Knex } from 'knex';
import { JwtModule, AccessTokenPayloadFn } from '../types';

const fetchFavoriters = async (req: Request, res: Response, db: Knex, jwt: JwtModule, accessTokenPayload: AccessTokenPayloadFn): Promise<void> => {
	const { username } = req.body;
	const toUser = username;
	const trx = await db.transaction();
	try {
		const { username } = await accessTokenPayload(req, res, jwt, db);
		const allFavoriters = await trx('favoriting').select('from_user').where('to_user', toUser);
		const resultUsers = allFavoriters.map((result: any) => result.from_user);
		//Add didFavortie to each user
		let finalUsers: any[] = [];
		if (resultUsers.length) {
			const usersFavoriting = await trx('favoriting')
				.select('to_user')
				.where((builder: any) => builder.where('from_user', username).whereIn('to_user', resultUsers));
			const usersSet = new Set<string>();
			usersFavoriting.forEach((user: any) => {
				usersSet.add(user['to_user']);
			});
			const finalResultUsers = allFavoriters.map((user: any) => {
				return { ...user, currentUser: username, didFavorite: usersSet.has(user['from_user']) ? true : false };
			});
			finalUsers = finalResultUsers;
		}
		res.json(finalUsers);
		await trx.commit();
	} catch {
		await trx.rollback();
		res.sendStatus(400);
	}
};

export { fetchFavoriters };
