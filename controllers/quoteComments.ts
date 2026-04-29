import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as quoteService from '../services/quote.service';

export const fetchComments = async (req: AuthRequest, res: Response, next: NextFunction) => {
	const { quoteId } = req.params;
	const commentDetails = await quoteService.getCommentsForQuote(Number(quoteId));
	res.json(commentDetails);
};

export const addComment = async (req: AuthRequest, res: Response, next: NextFunction) => {
	const { quoteId, comment } = req.body;
	if (!req.user) {
		return res.status(401).json({ message: 'User not authenticated' });
	}
	const { username } = req.user;
	const addedComment = await quoteService.addQuoteComment(username, Number(quoteId), comment);
	res.json(addedComment);
};
