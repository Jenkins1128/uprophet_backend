import { Request, Response } from 'express';
import { eq, sql, inArray } from 'drizzle-orm';
import { JwtModule, AccessTokenPayloadFn } from '../types';
import type { Database } from '../db';
import { favoriting } from '../db/schema';

const fetchFavoriters = async (req: Request, res: Response, db: Database, jwt: JwtModule, accessTokenPayload: AccessTokenPayloadFn): Promise<void> => {
	const { username } = req.body;
	const toUser = username;
	try {
		const { username: currentUser } = await accessTokenPayload(req, res, jwt, db);

		const allFavoriters = await db.select({ fromUser: favoriting.fromUser })
			.from(favoriting)
			.where(eq(favoriting.toUser, toUser));
		const resultUsers = allFavoriters.map((r) => r.fromUser);

		if (!resultUsers.length) {
			res.json([]);
			return;
		}

		//Add didFavorite to each user
		const usersFavoritingResult = await db.select({ toUser: favoriting.toUser })
			.from(favoriting)
			.where(sql`${favoriting.fromUser} = ${currentUser} AND ${favoriting.toUser} IN ${resultUsers}`);
		const favoritedSet = new Set<string>(usersFavoritingResult.map((u) => u.toUser));

		const finalResultUsers = allFavoriters.map((user) => ({
			from_user: user.fromUser,
			currentUser: currentUser,
			didFavorite: favoritedSet.has(user.fromUser),
		}));

		res.json(finalResultUsers);
	} catch {
		res.sendStatus(400);
	}
};

export { fetchFavoriters };
