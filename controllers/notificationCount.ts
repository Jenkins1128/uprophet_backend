import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as userService from '../services/user.service';

export const getNotificationCount = async (req: AuthRequest, res: Response, next: NextFunction) => {
	const { username } = req.user!;
	const count = await userService.getUnreadNotificationCount(username);
	res.json({ notificationCount: count });
};
