import { mysqlTable, mysqlSchema, AnyMySqlColumn, index, foreignKey, primaryKey, bigint, varchar, datetime, tinytext, int, unique, text } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const comments = mysqlTable("comments", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	quotesId: bigint("quotes_id", { mode: "number" }).notNull().references(() => quotes.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	comment: varchar({ length: 255 }).notNull(),
	commenter: varchar({ length: 20 }).notNull(),
	datePosted: datetime("date_posted", { mode: 'string'}),
},
(table) => [
	index("quotes_id_idx").on(table.quotesId),
	primaryKey({ columns: [table.id], name: "comments_id"}),
]);

export const favoriteNotifications = mysqlTable("favorite_notifications", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	notice: tinytext().notNull(),
	toUser: varchar("to_user", { length: 20 }).notNull(),
	read: int().default(0).notNull(),
	date: datetime({ mode: 'string'}),
},
(table) => [
	primaryKey({ columns: [table.id], name: "favorite_notifications_id"}),
]);

export const favoriting = mysqlTable("favoriting", {
	fromUser: varchar("from_user", { length: 20 }).notNull(),
	toUser: varchar("to_user", { length: 20 }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.fromUser, table.toUser], name: "favoriting_from_user_to_user"}),
]);

export const likes = mysqlTable("likes", {
	usersId: bigint("users_id", { mode: "number" }).notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	quotesId: bigint("quotes_id", { mode: "number" }).notNull().references(() => quotes.id, { onDelete: "cascade", onUpdate: "cascade" } ),
},
(table) => [
	index("quotes_id_idx").on(table.quotesId),
	primaryKey({ columns: [table.usersId, table.quotesId], name: "likes_users_id_quotes_id"}),
]);

export const login = mysqlTable("login", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	password: varchar({ length: 128 }).notNull(),
	userName: varchar("user_name", { length: 20 }).notNull(),
	usersId: bigint("users_id", { mode: "number" }).notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	userRegistered: bigint("user_registered", { mode: "number" }).notNull(),
},
(table) => [
	index("_idx").on(table.usersId),
	primaryKey({ columns: [table.id], name: "login_id"}),
	unique("user_name_UNIQUE").on(table.userName),
]);

export const quoteNotifications = mysqlTable("quote_notifications", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	notice: tinytext().notNull(),
	quotesId: bigint("quotes_id", { mode: "number" }).notNull(),
	read: int().default(0).notNull(),
	date: datetime({ mode: 'string'}),
},
(table) => [
	index("quotes_id_idx").on(table.quotesId),
	primaryKey({ columns: [table.id], name: "quote_notifications_id"}),
]);

export const quotes = mysqlTable("quotes", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	userName: varchar("user_name", { length: 20 }),
	title: varchar({ length: 255 }),
	quote: text(),
	datePosted: datetime("date_posted", { mode: 'string'}),
},
(table) => [
	primaryKey({ columns: [table.id], name: "quotes_id"}),
]);

export const users = mysqlTable("users", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	name: varchar({ length: 20 }),
	userName: varchar("user_name", { length: 20 }),
	email: varchar({ length: 100 }),
	// Warning: Can't parse longblob from database
	// longblobType: longblob("photo"),
	bio: text(),
	photoName: varchar("photo_name", { length: 100 }),
	refreshToken: varchar("refresh_token", { length: 1000 }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "users_id"}),
	unique("user_name_UNIQUE").on(table.userName),
]);
