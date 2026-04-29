import { relations } from "drizzle-orm/relations";
import { quotes, comments, likes, users, login } from "./schema";

export const commentsRelations = relations(comments, ({one}) => ({
	quote: one(quotes, {
		fields: [comments.quotesId],
		references: [quotes.id]
	}),
}));

export const quotesRelations = relations(quotes, ({many}) => ({
	comments: many(comments),
	likes: many(likes),
}));

export const likesRelations = relations(likes, ({one}) => ({
	quote: one(quotes, {
		fields: [likes.quotesId],
		references: [quotes.id]
	}),
	user: one(users, {
		fields: [likes.usersId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	likes: many(likes),
	logins: many(login),
}));

export const loginRelations = relations(login, ({one}) => ({
	user: one(users, {
		fields: [login.usersId],
		references: [users.id]
	}),
}));