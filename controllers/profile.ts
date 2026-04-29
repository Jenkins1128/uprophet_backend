import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as userService from '../services/user.service';

export const fetchProfileQuotes = async (req: AuthRequest, res: Response, next: NextFunction) => {
	const { username } = req.body;
	const { id } = req.user!;
	const quotes = await userService.getUserProfileQuotes(id, username);
	res.json(quotes);
};

export const getUserInfo = async (req: AuthRequest, res: Response, next: NextFunction) => {
	const { username } = req.body;
	const currentUsername = req.user!.username;
	const userInfo = await userService.getUserInformation(currentUsername, username);
	res.json(userInfo);
};

export const getCurrentUserInfo = async (req: AuthRequest, res: Response, next: NextFunction) => {
	const { username } = req.user!;
	const userInfo = await userService.getCurrentUserInfoShort(username);
	res.json(userInfo);
};
