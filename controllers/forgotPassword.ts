import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { Resend } from 'resend';
import { db } from '../db';
import { login, users } from '../db/schema';

const resend = new Resend(process.env.RESEND_API_KEY);
const SITE_KEY = process.env.SITE_KEY!;
const NONCE_SALT = process.env.NONCE_SALT!;

const sendMail = async (username: string, userEmail: string, tempPassword: string): Promise<void> => {
    try {
        await resend.emails.send({
            from: 'Uprophet <noreply@recovery.uprophet.com>',
            to: userEmail,
            subject: 'Uprophet Temporary Password',
            html: `Hello ${username},<br><br>Here is your temporary password: <strong>${tempPassword}</strong> <br><br> <a href="https://uprophet.com/changepassword">Change Password</a>`
        });
    } catch (error) {
        console.error("Resend API Error:", error);
        throw error;
    }
};

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

function randomString(size: number): string {
	return crypto.randomBytes(size).toString('base64').slice(0, size);
}

const resetPassword = async (username: string): Promise<string> => {
	const randPass = randomString(7);
	const userreg = new Date().getTime();
	const hash = hashPass(username, randPass, userreg);

	await db.update(login)
		.set({ password: hash, userRegistered: userreg })
		.where(eq(login.userName, username));
	
	return randPass;
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
	const { username, email } = req.body;
	
	const userEmailResult = await db.select({ email: users.email })
		.from(users)
		.where(eq(users.userName, username));
	
	if (!userEmailResult.length) {
		return res.status(404).json({ message: 'User not found' });
	}

	if (userEmailResult[0].email !== email) {
		return res.status(400).json({ message: 'Email mismatch' });
	}

	const tempPass = await resetPassword(username);
	await sendMail(username, userEmailResult[0].email!, tempPass);
	res.sendStatus(200);
};
