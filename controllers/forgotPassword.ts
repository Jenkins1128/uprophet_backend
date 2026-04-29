import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
	const { username, email } = req.body;
	
	try {
		await authService.processForgotPassword(username, email);
		res.sendStatus(200);
	} catch (error: any) {
		if (error.message === 'User not found') {
			return res.status(404).json({ message: error.message });
		}
		if (error.message === 'Email mismatch') {
			return res.status(400).json({ message: error.message });
		}
		next(error);
	}
};
