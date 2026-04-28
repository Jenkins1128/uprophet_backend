import { Response, NextFunction } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { favoriting, favoriteNotifications } from '../db/schema';
import { AuthRequest } from '../types';

export const favoriteUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
	const { toUser } = req.body;
	const { username } = req.user!;

	await db.transaction(async (tx) => {
		await tx.insert(favoriting).values({
			fromUser: username,
			toUser: toUser,
		});
		await tx.insert(favoriteNotifications).values({
			notice: `${username} favorited you.`,
			toUser: toUser,
			date: new Date().toISOString().replace('T', ' ').substr(0, 19),
		});
	});
	res.sendStatus(200);
};

export const unfavoriteUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
	const { toUser } = req.body;
	const { username } = req.user!;

	await db.delete(favoriting).where(
		and(eq(favoriting.fromUser, username), eq(favoriting.toUser, toUser))
	);
	res.sendStatus(200);
};
