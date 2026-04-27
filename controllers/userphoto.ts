import { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { JwtModule, AccessTokenPayloadFn } from '../types';
import type { Database } from '../db';
import { users } from '../db/schema';

const uploadPhoto = async (req: Request, res: Response, db: Database, jwt: JwtModule, accessTokenPayload: AccessTokenPayloadFn): Promise<void> => {
	const { name, image } = req.body;
	try {
		const { username } = await accessTokenPayload(req, res, jwt, db);
		await db.update(users)
			.set({
				photoName: name,
				photo: Buffer.from(image, 'utf-8'),
			})
			.where(eq(users.userName, username));
		res.sendStatus(200);
	} catch (error) {
		res.sendStatus(400);
	}
};

const fetchPhoto = async (req: Request, res: Response, db: Database): Promise<void> => {
	const { username } = req.body;
	try {
		const img = await db.select({ photo: users.photo })
			.from(users)
			.where(eq(users.userName, username));
		if (img.length && img[0].photo) {
			res.json({ photo: img[0].photo.toString() });
		} else {
			res.json({ photo: null });
		}
	} catch (error) {
		res.sendStatus(400);
	}
};

export { uploadPhoto, fetchPhoto };
