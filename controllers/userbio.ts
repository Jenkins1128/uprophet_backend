import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as userService from '../services/user.service';

export const saveBio = async (req: AuthRequest, res: Response, next: NextFunction) => {
	const { bio } = req.body;
	const { username } = req.user!;
	await userService.updateUserBio(username, bio);
	res.sendStatus(200);
};
