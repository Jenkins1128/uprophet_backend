const sendMail = async (username, userEmail, tempPassword, nodemailer) => {
	// create reusable transporter object using the default SMTP transport
	let transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: 'uprophetworld@gmail.com',
			pass: process.env.GMAIL_PASS
		}
	});
	// send mail with defined transport object
	await transporter.sendMail({
		from: '"Uprophet" <uprophetworld@gmail.com>', // sender address
		to: userEmail, // list of receivers
		subject: 'Uprophet Temporary Password', // Subject line
		html: `Hello ${username},<br><br>Here is your temporary password: <strong>${tempPassword}</strong> <br><br> <a href="https://uprophet.com/changepassword">Change Password</a>` // html body
	});
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

const forgotPassword = async (req, res, db, crypto, NONCE_SALT, SITE_KEY, nodemailer) => {
	const { username, email } = req.body;
	try {
		const userEmail = await db('users').select('email').where('user_name', username);
		if (userEmail.length && userEmail[0].email !== email) {
			throw new Exception();
		}
		const tempPass = await changePassword(res, username, db, crypto, NONCE_SALT, SITE_KEY);
		await sendMail(username, userEmail[0].email, tempPass, nodemailer);
		res.sendStatus(200);
	} catch (error) {
		res.sendStatus(400);
	}
};

module.exports = { forgotPassword };
