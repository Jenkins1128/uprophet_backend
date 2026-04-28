import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as quoteService from '../services/quote.service';

export const fetchHome = async (req: AuthRequest, res: Response, next: NextFunction) => {
	const userId = req.user!.id;
	const username = req.user!.username;
	const quotes = await quoteService.getHomeQuotes(userId, username);
	res.json(quotes);
};

export const createQuote = async (req: AuthRequest, res: Response, next: NextFunction) => {
	const { title, quote } = req.body;
	const username = req.user!.username;
	const finalQuote = await quoteService.createNewQuote(username, title, quote);
	res.json(finalQuote);
};
