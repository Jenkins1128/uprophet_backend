const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

const sendMail = async (username, userEmail, tempPassword) => {
    try {
        const data = await resend.emails.send({
            from: 'Uprophet <noreply@recovery.uprophet.com>',
            to: userEmail,
            subject: 'Uprophet Temporary Password',
            html: `Hello ${username},<br><br>Here is your temporary password: <strong>${tempPassword}</strong> <br><br> <a href="https://uprophet.com/changepassword">Change Password</a>`
        });
        console.log("SUCCESS: Email sent via Resend API", data);
    } catch (error) {
        console.error("Resend API Error:", error);
        throw error;
    }
};

const hashPass = (username, password, userreg, crypto, NONCE_SALT, SITE_KEY) => {
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

function randomString(crypto, size) {
	return crypto.randomBytes(size).toString('base64').slice(0, size);
}

const changePassword = async (res, username, db, crypto, NONCE_SALT, SITE_KEY) => {
	if (!username.length) {
		return res.status(400).json('incorrect form submission');
	}
	const randPass = randomString(crypto, 7);
	const userreg = new Date().getTime();
	const hash = hashPass(username, randPass, userreg, crypto, NONCE_SALT, SITE_KEY);

	try {
		await db('login')
			.update({
				password: hash,
				user_registered: userreg
			})
			.where('user_name', username);
		return randPass;
	} catch (err) {
		res.status(400).json('user name does not exist: ' + err);
	}
};

const forgotPassword = async (req, res, db, crypto, NONCE_SALT, SITE_KEY) => {
	const { username, email } = req.body;
	try {
		const userEmail = await db('users').select('email').where('user_name', username);
		if (userEmail.length && userEmail[0].email !== email) {
			throw new Exception();
		}
		console.log("forogt userEmail found", userEmail);
		const tempPass = await changePassword(res, username, db, crypto, NONCE_SALT, SITE_KEY);
		console.log("tempPass created!", userEmail);
		await sendMail(username, userEmail[0].email, tempPass);
		res.sendStatus(200);
	} catch (error) {
		console.error("DETAILED AUTH ERROR:", error); // This is the gold mine for debugging
		res.sendStatus(400);
	}
};

module.exports = { forgotPassword };
