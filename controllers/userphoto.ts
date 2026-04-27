import { Request, Response } from 'express';
import { Knex } from 'knex';
import { JwtModule, AccessTokenPayloadFn } from '../types';

const uploadPhoto = async (req: Request, res: Response, db: Knex, jwt: JwtModule, accessTokenPayload: AccessTokenPayloadFn): Promise<void> => {
	const { name, image } = req.body;
	try {
		const { username } = await accessTokenPayload(req, res, jwt, db);
		await db('users')
			.update({
				photo_name: name,
				photo: image
			})
			.where('user_name', username);
		res.sendStatus(200);
	} catch (error) {
		res.sendStatus(400);
	}
};

const fetchPhoto = async (req: Request, res: Response, db: Knex): Promise<void> => {
	const { username } = req.body;
	try {
		const img = await db('users').select('photo').where('user_name', username);
		if (img.length && (img[0] as any)['photo']) {
			const buffer = (img[0] as any)['photo'];
			res.json({ photo: buffer.toString() });
		} else {
			res.json({ photo: null });
		}
	} catch (error) {
		res.sendStatus(400);
	}
};

export { uploadPhoto, fetchPhoto };
