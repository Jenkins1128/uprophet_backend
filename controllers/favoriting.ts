import { Request, Response } from 'express';
import { eq, sql } from 'drizzle-orm';
import { JwtModule, AccessTokenPayloadFn } from '../types';
import type { Database } from '../db';
import { favoriting } from '../db/schema';

const fetchFavoriting = async (req: Request, res: Response, db: Database, jwt: JwtModule, accessTokenPayload: AccessTokenPayloadFn): Promise<void> => {
	const { username } = req.body;
	const fromUser = username;
	try {
		const { username: currentUser } = await accessTokenPayload(req, res, jwt, db);

		const allFavoriting = await db.select({ toUser: favoriting.toUser })
			.from(favoriting)
			.where(eq(favoriting.fromUser, fromUser));
		const resultUsers = allFavoriting.map((r) => r.toUser);

		if (!resultUsers.length) {
			res.json([]);
			return;
		}

		//Add didFavorite to each user
		const usersFavoritingResult = await db.select({ toUser: favoriting.toUser })
			.from(favoriting)
			.where(sql`${favoriting.fromUser} = ${currentUser} AND ${favoriting.toUser} IN ${resultUsers}`);
		const favoritedSet = new Set<string>(usersFavoritingResult.map((u) => u.toUser));

		const finalResultUsers = allFavoriting.map((user) => ({
			to_user: user.toUser,
			currentUser: currentUser,
			didFavorite: favoritedSet.has(user.toUser),
		}));

		res.json(finalResultUsers);
	} catch {
		res.sendStatus(400);
	}
};

export { fetchFavoriting };
