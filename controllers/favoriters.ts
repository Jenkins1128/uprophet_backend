import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as userService from '../services/user.service';

export const fetchFavoriters = async (req: AuthRequest, res: Response, next: NextFunction) => {
	const { username: toUser } = req.body;
	const { username: currentUser } = req.user!;
	const result = await userService.getFavoritersWithStatus(toUser, currentUser);
	res.json(result);
};
