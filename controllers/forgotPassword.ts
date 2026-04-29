import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
	const { username, email } = req.body;
	
	try {
		await authService.processForgotPassword(username, email);
		res.sendStatus(200);
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		if (message === 'User not found') {
			return res.status(404).json({ message });
		}
		if (message === 'Email mismatch') {
			return res.status(400).json({ message });
		}
		next(error);
	}
};
