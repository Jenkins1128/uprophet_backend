import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as userService from '../services/user.service';

export const getSearchResults = async (req: AuthRequest, res: Response, next: NextFunction) => {
	const { search } = req.body;
	const { username } = req.user!;
	const finalResultUsers = await userService.searchUsersWithStatus(search, username);
	res.json(finalResultUsers);
};
