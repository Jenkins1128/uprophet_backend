import crypto from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { Resend } from 'resend';
import { db } from '../db';
import { login, users } from '../db/schema';

const resend = new Resend(process.env.RESEND_API_KEY);
const SITE_KEY = process.env.SITE_KEY!;
const NONCE_SALT = process.env.NONCE_SALT!;

// --- HELPER FUNCTIONS ---

const hashPass = (username: string, password: string, userreg: number): string => {
	const nonce = crypto
		.createHash('md5')
		.update('registration-' + username + userreg + NONCE_SALT)
		.digest('hex');
	const userpass = crypto
		.createHmac('sha512', SITE_KEY)
		.update(password + nonce)
		.digest('hex');
	return userpass;
};

const compare = (username: string, password: string, data: any[]): boolean => {
	if (!data.length) return false;
	const storeg = data[0].userRegistered;
	const stopass = data[0].password;
	const nonce = crypto
		.createHash('md5')
		.update('registration-' + username + storeg + NONCE_SALT)
		.digest('hex');
	const subpass = crypto
		.createHmac('sha512', SITE_KEY)
		.update(password + nonce)
		.digest('hex');
	return subpass === stopass;
};

function randomString(size: number): string {
	return crypto.randomBytes(size).toString('base64').slice(0, size);
}

// --- SERVICE METHODS ---

export const signupUser = async (username: string, name: string, email: string, password: string) => {
	const userreg = new Date().getTime();
	const hash = hashPass(username, password, userreg);

	return await db.transaction(async (tx) => {
		const usersResult = await tx.insert(users).values({
			name: name,
			userName: username,
			email: email,
		});
		const usersId = usersResult[0].insertId;

		const loginResult = await tx.insert(login).values({
			password: hash,
			userName: username,
			usersId: usersId,
			userRegistered: userreg,
		});

		return loginResult[0].insertId;
	});
};

export const signinUser = async (username: string, password: string) => {
	const data = await db.select({
		userName: login.userName,
		password: login.password,
		usersId: login.usersId,
		userRegistered: login.userRegistered,
	}).from(login).where(eq(login.userName, username));

	if (!compare(username, password, data)) {
		return null;
	}

	const payload = { id: data[0].usersId, username: data[0].userName };
	
	const accessSignOptions: SignOptions = {
		algorithm: 'HS256',
		expiresIn: process.env.ACCESS_TOKEN_LIFE as any,
	};
	const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET!, accessSignOptions);
	
	const refreshSignOptions: SignOptions = {
		algorithm: 'HS256',
		expiresIn: process.env.REFRESH_TOKEN_LIFE as any,
	};
	const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET!, refreshSignOptions);
	
	await db.update(users).set({ refreshToken }).where(eq(users.userName, username));
	
	return { accessToken, refreshToken, user: payload };
};

export const logoutUser = async (username: string) => {
	await db.update(users).set({ refreshToken: '' }).where(eq(users.userName, username));
};

export const verifyCredentials = async (username: string, password: string) => {
	const data = await db.select({
		userName: login.userName,
		password: login.password,
		usersId: login.usersId,
		userRegistered: login.userRegistered,
	}).from(login).where(eq(login.userName, username));

	return compare(username, password, data);
};

export const updatePassword = async (username: string, password: string) => {
	const userreg = new Date().getTime();
	const hash = hashPass(username, password, userreg);

	await db.update(login)
		.set({ password: hash, userRegistered: userreg })
		.where(eq(login.userName, username));
};

export const processForgotPassword = async (username: string, email: string) => {
	const userResult = await db.select({ email: users.email })
		.from(users)
		.where(eq(users.userName, username));
	
	if (!userResult.length) {
		throw new Error('User not found');
	}

	if (userResult[0].email !== email) {
		throw new Error('Email mismatch');
	}

	const randPass = randomString(7);
	const userreg = new Date().getTime();
	const hash = hashPass(username, randPass, userreg);

	await db.update(login)
		.set({ password: hash, userRegistered: userreg })
		.where(eq(login.userName, username));
	
	// Send email
	await resend.emails.send({
		from: 'Uprophet <noreply@recovery.uprophet.com>',
		to: email,
		subject: 'Uprophet Temporary Password',
		html: `Hello ${username},<br><br>Here is your temporary password: <strong>${randPass}</strong> <br><br> <a href="https://uprophet.com/changepassword">Change Password</a>`
	});

	return true;
};
