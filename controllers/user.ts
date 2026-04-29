import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';

export const getUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
	res.json(req.user!.username);
};
