import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as userService from '../services/user.service';

export const favoriteUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
	const { toUser } = req.body;
	const { username } = req.user!;
	await userService.favoriteAUser(username, toUser);
	res.sendStatus(200);
};

export const unfavoriteUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
	const { toUser } = req.body;
	const { username } = req.user!;
	await userService.unfavoriteAUser(username, toUser);
	res.sendStatus(200);
};
