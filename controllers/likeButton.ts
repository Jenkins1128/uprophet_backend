import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as quoteService from '../services/quote.service';

export const likeQuote = async (req: AuthRequest, res: Response, next: NextFunction) => {
	const { quoteId } = req.body;
	const { id, username } = req.user!;
	await quoteService.likeAQuote(id, username, quoteId);
	res.sendStatus(200);
};

export const unlikeQuote = async (req: AuthRequest, res: Response, next: NextFunction) => {
	const { quoteId } = req.body;
	const { id } = req.user!;
	await quoteService.unlikeAQuote(id, quoteId);
	res.sendStatus(200);
};
