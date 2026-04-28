import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validate = (schema: ZodSchema) => {
	return (req: Request, res: Response, next: NextFunction) => {
		try {
			// We validate req.body and potentially update it with parsed values
			req.body = schema.parse(req.body);
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
