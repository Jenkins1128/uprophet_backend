import { Response, NextFunction } from 'express';
import { eq, sql, inArray, and } from 'drizzle-orm';
import { db } from '../db';
import { favoriting } from '../db/schema';
import { AuthRequest } from '../types';

export const fetchFavoriters = async (req: AuthRequest, res: Response, next: NextFunction) => {
	const { username: toUser } = req.body;
	const { username: currentUser } = req.user!;

	const allFavoriters = await db.select({ fromUser: favoriting.fromUser })
		.from(favoriting)
		.where(eq(favoriting.toUser, toUser));
	
	const resultUsers = allFavoriters.map((r) => r.fromUser);

	if (!resultUsers.length) {
		return res.json([]);
	}

	const usersFavoritingResult = await db.select({ toUser: favoriting.toUser })
		.from(favoriting)
		.where(and(
			eq(favoriting.fromUser, currentUser),
			inArray(favoriting.toUser, resultUsers)
		));
	
	const favoritedSet = new Set<string>(usersFavoritingResult.map((u) => u.toUser));

	const finalResultUsers = allFavoriters.map((user) => ({
		from_user: user.fromUser,
		currentUser: currentUser,
		didFavorite: favoritedSet.has(user.fromUser),
	}));

	res.json(finalResultUsers);
};
