import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	out: './drizzle',
	schema: './db/schema.ts',
	dialect: 'mysql',
	dbCredentials: {
		host: process.env.HOST!,
		user: process.env.USER_DEV!,
		password: process.env.PASSWORD_DEV!,
		database: process.env.DATABASE_DEV!,
	},
});
