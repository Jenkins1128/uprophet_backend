export class AppError extends Error {
	public readonly status: number;
	public readonly isOperational: boolean;

	constructor(message: string, status: number = 500, isOperational: boolean = true) {
		super(message);
		this.status = status;
		this.isOperational = isOperational;

		Object.setPrototypeOf(this, AppError.prototype);
		Error.captureStackTrace(this, this.constructor);
	}
}

export const isAppError = (err: unknown): err is AppError => {
	return err instanceof AppError;
};
