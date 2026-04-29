import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types/errors';

export const errorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
	console.error(`[Error] ${req.method} ${req.url}:`, err);

	let status = 500;
	let message = 'Internal Server Error';

	if (err instanceof AppError) {
		status = err.status;
		message = err.message;
	} else if (err instanceof Error) {
		message = err.message;
		// Some libraries attach status to the Error object
		if ('status' in err && typeof err.status === 'number') {
			status = err.status;
		}
	}

	res.status(status).json({
		error: {
			message,
			status,
			...(process.env.NODE_ENV === 'development' && err instanceof Error && { stack: err.stack })
		}
	});
};
