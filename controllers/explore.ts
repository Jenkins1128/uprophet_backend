import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as quoteService from '../services/quote.service';

export const fetchExplore = async (req: AuthRequest, res: Response, next: NextFunction) => {
	if (!req.user) {
		return res.status(401).json({ message: 'User not authenticated' });
	}
	const { id } = req.user;
	const finalQuotes = await quoteService.getRandomExploreQuotes(id);
	res.json(finalQuotes);
};

