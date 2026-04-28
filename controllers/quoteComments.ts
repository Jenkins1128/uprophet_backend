import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as quoteService from '../services/quote.service';

export const fetchComments = async (req: AuthRequest, res: Response, next: NextFunction) => {
	const { quoteId } = req.body;
	const commentDetails = await quoteService.getCommentsForQuote(quoteId);
	res.json(commentDetails);
};

export const addComment = async (req: AuthRequest, res: Response, next: NextFunction) => {
	const { quoteId, comment } = req.body;
	const { username } = req.user!;
	const addedComment = await quoteService.addQuoteComment(username, quoteId, comment);
	res.json(addedComment);
};
