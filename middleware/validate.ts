import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

type RequestSource = 'body' | 'params';

export const validate = (schema: ZodSchema, source: RequestSource = 'body') => {
	return (req: Request, res: Response, next: NextFunction) => {
		try {
			const parsed = schema.parse(req[source]);
			if (source === 'body') {
				req.body = parsed;
			} else {
				// params is read-only in Express types; cast to unknown then to the parsed type
				(req as unknown as { params: typeof parsed }).params = parsed;
			}
			next();
		} catch (error) {
			if (error instanceof ZodError) {
				res.status(400).json({
					message: 'Validation failed',
					errors: error.issues.map(err => ({
						path: err.path.join('.'),
						message: err.message
					}))
				});
				return;
			}
			next(error);
		}
	};
};
