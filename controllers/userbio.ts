import { Response, NextFunction } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../db/schema';
import { AuthRequest } from '../types';

export const saveBio = async (req: AuthRequest, res: Response, next: NextFunction) => {
	const { bio } = req.body;
	const { username } = req.user!;
	await db.update(users)
		.set({ bio })
		.where(eq(users.userName, username));
	res.sendStatus(200);
};
