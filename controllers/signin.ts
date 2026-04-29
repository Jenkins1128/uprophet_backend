import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as authService from '../services/auth.service';

export const handleSignin = async (req: Request, res: Response, next: NextFunction) => {
	const { username, password } = req.body;
	
	const result = await authService.signinUser(username, password);

	if (result) {
		res.cookie('upUserId', result.accessToken, {
			httpOnly: true,
			secure: true,
			sameSite: 'none',
			maxAge: 1000 * 60 * 60 * 24, // 24 hours
		});
		res.sendStatus(200);
	} else {
		res.status(401).json({ message: 'Invalid credentials' });
	}
};

export const logout = async (req: AuthRequest, res: Response, next: NextFunction) => {
	const { username } = req.user!;
	await authService.logoutUser(username);
	res.clearCookie('upUserId');
	res.sendStatus(204);
};
