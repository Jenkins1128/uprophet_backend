import { Response, NextFunction } from 'express';
import { like, and, eq, inArray } from 'drizzle-orm';
import { db } from '../db';
import { users, favoriting } from '../db/schema';
import { AuthRequest } from '../types';

export const getSearchResults = async (req: AuthRequest, res: Response, next: NextFunction) => {
	const { search } = req.body;
	const { username } = req.user!;

	const results = await db.select({ id: users.id, userName: users.userName })
		.from(users)
		.where(like(users.userName, `%${search}%`))
		.limit(15);
	
	const resultUserNames = results.map((r) => r.userName).filter((name): name is string => name !== null);

	if (!resultUserNames.length) {
		return res.json([]);
	}

	const usersFavoritingResult = await db.select({ toUser: favoriting.toUser })
		.from(favoriting)
		.where(and(
			eq(favoriting.fromUser, username),
			inArray(favoriting.toUser, resultUserNames)
		));
	
	const favoritedSet = new Set<string>(usersFavoritingResult.map((u) => u.toUser));

	const finalResultUsers = results.map((user) => ({
		id: user.id,
		user_name: user.userName,
		currentUser: username,
		didFavorite: favoritedSet.has(user.userName ?? ''),
	}));

	res.json(finalResultUsers);
};
