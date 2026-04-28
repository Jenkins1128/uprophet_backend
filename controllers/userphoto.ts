import { Response, NextFunction } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../db/schema';
import { AuthRequest } from '../types';

export const uploadPhoto = async (req: AuthRequest, res: Response, next: NextFunction) => {
	const { name, image } = req.body;
	const { username } = req.user!;
	await db.update(users)
		.set({
			photoName: name,
			photo: Buffer.from(image, 'utf-8'),
		})
		.where(eq(users.userName, username));
	res.sendStatus(200);
};

export const fetchPhoto = async (req: AuthRequest, res: Response, next: NextFunction) => {
	const { username } = req.body;
	const img = await db.select({ photo: users.photo })
		.from(users)
		.where(eq(users.userName, username));
	
	if (img.length && img[0].photo) {
		res.json({ photo: img[0].photo.toString() });
	} else {
		res.json({ photo: null });
	}
};
