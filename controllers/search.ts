import { Request, Response } from 'express';
import { like, eq, inArray, sql } from 'drizzle-orm';
import { JwtModule, AccessTokenPayloadFn } from '../types';
import type { Database } from '../db';
import { users, favoriting } from '../db/schema';

const getSearchResults = async (req: Request, res: Response, db: Database, jwt: JwtModule, accessTokenPayload: AccessTokenPayloadFn): Promise<void> => {
	const { search } = req.body;
	try {
		const { username } = await accessTokenPayload(req, res, jwt, db);

		const results = await db.select({ id: users.id, userName: users.userName })
			.from(users)
			.where(like(users.userName, `%${search}%`))
			.limit(15);
		const resultUserNames = results.map((r) => r.userName).filter((name): name is string => name !== null);

		if (!resultUserNames.length) {
			res.json([]);
			return;
		}

		//Add didFavorite to each user
		const usersFavoritingResult = await db.select({ toUser: favoriting.toUser })
			.from(favoriting)
			.where(sql`${favoriting.fromUser} = ${username} AND ${favoriting.toUser} IN ${resultUserNames}`);
		const favoritedSet = new Set<string>(usersFavoritingResult.map((u) => u.toUser));

		const finalResultUsers = results.map((user) => ({
			id: user.id,
			user_name: user.userName,
			currentUser: username,
			didFavorite: favoritedSet.has(user.userName ?? ''),
		}));

		res.json(finalResultUsers);
	} catch {
		res.sendStatus(400);
	}
};

export { getSearchResults };
