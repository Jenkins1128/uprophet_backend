import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as userService from '../services/user.service';

export const uploadPhoto = async (req: AuthRequest, res: Response, next: NextFunction) => {
	const { name, image } = req.body;
	const { username } = req.user!;
	await userService.updateUserPhoto(username, name, image);
	res.sendStatus(200);
};

export const fetchPhoto = async (req: AuthRequest, res: Response, next: NextFunction) => {
	const { username } = req.body;
	const photo = await userService.getUserPhoto(username);
	res.json({ photo });
};
