import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as userService from '../services/user.service';

export const fetchNotifications = async (req: AuthRequest, res: Response, next: NextFunction) => {
	const { username } = req.user!;
	const allNotifications = await userService.getAndReadNotifications(username);
	res.json(allNotifications);
};
