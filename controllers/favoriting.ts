import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as userService from '../services/user.service';

export const fetchFavoriting = async (req: AuthRequest, res: Response, next: NextFunction) => {
	const { username: fromUser } = req.body;
	const { username: currentUser } = req.user!;
	const result = await userService.getFavoritingWithStatus(fromUser, currentUser);
	res.json(result);
};
