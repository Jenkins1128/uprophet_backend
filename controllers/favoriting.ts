import { Response, NextFunction } from 'express';
import { eq, sql, and, inArray } from 'drizzle-orm';
import { db } from '../db';
import { favoriting } from '../db/schema';
import { AuthRequest } from '../types';

export const fetchFavoriting = async (req: AuthRequest, res: Response, next: NextFunction) => {
	const { username: fromUser } = req.body;
	const { username: currentUser } = req.user!;

	const allFavoriting = await db.select({ toUser: favoriting.toUser })
		.from(favoriting)
		.where(eq(favoriting.fromUser, fromUser));
	
	const resultUsers = allFavoriting.map((r) => r.toUser);

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

	const finalResultUsers = allFavoriting.map((user) => ({
		to_user: user.toUser,
		currentUser: currentUser,
		didFavorite: favoritedSet.has(user.toUser),
	}));

	res.json(finalResultUsers);
};
