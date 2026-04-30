import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

const isProd = true;

const pool = mysql.createPool(
	isProd
		? { uri: process.env.MYSQL_URL }
		: {
			host: process.env.HOST,
			user: process.env.USER_DEV,
			password: process.env.PASSWORD_DEV,
			database: process.env.DATABASE_DEV,
		}
);

export const db = drizzle(pool, { schema, mode: 'default' });

export type Database = typeof db;
