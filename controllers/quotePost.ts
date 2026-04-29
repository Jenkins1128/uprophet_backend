import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as quoteService from '../services/quote.service';

export const getQuotePost = async (req: AuthRequest, res: Response, next: NextFunction) => {
	const { quoteId } = req.params;
	if (!req.user) {
		return res.status(401).json({ message: 'User not authenticated' });
	}
	const { id } = req.user;
	const quote = await quoteService.getSingleQuote(id, Number(quoteId));
	if (!quote) return res.status(404).json({ message: 'Quote not found' });
	res.json(quote);
};

export const deleteQuotePost = async (req: AuthRequest, res: Response, next: NextFunction) => {
	const { quoteId } = req.body;
	await quoteService.deleteQuote(Number(quoteId));
	res.sendStatus(200);
};
