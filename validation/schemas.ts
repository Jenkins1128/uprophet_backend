import { z } from 'zod';

export const usernameSchema = z.object({
	username: z.string().min(1),
});

export const signinSchema = z.object({
	username: z.string().min(1),
	password: z.string().min(1),
});

export const signupSchema = z.object({
	username: z.string().min(3).max(20),
	name: z.string().min(1).max(20),
	email: z.string().email().max(100),
	password: z.string().min(6).max(128),
});

export const createQuoteSchema = z.object({
	title: z.string().min(1).max(255),
	quote: z.string().min(1),
});

export const quoteIdSchema = z.object({
	quoteId: z.coerce.number().int().positive(),
});

export const addCommentSchema = z.object({
	quoteId: z.coerce.number().int().positive(),
	comment: z.string().min(1).max(255),
});

export const toUserSchema = z.object({
	toUser: z.string().min(1).max(20),
});

export const searchSchema = z.object({
	search: z.string().min(1),
});

export const bioSchema = z.object({
	bio: z.string().max(1000), // Adjust max as needed
});

export const uploadPhotoSchema = z.object({
	name: z.string().min(1).max(100),
	image: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
	username: z.string().min(1),
	email: z.string().email(),
});
