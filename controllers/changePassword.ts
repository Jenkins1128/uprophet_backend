import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
	const { username, password } = req.body;
	await authService.updatePassword(username, password);
	res.sendStatus(200);
};

export const changePasswordSignin = async (req: Request, res: Response, next: NextFunction) => {
	const { username, password } = req.body;
	const isValid = await authService.verifyCredentials(username, password);

	if (isValid) {
		res.sendStatus(200);
	} else {
		res.status(401).json({ message: 'Invalid credentials' });
	}
};
