import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';

export const handleSignup = async (req: Request, res: Response, next: NextFunction) => {
	const { username, name, email, password } = req.body;
	const loginId = await authService.signupUser(username, name, email, password);
	res.json(loginId);
};
