const sendMail = async (username, userEmail, tempPassword, nodemailer, myAccessToken) => {
	console.log('Attempting to send mail. Token type:', typeof myAccessToken, myAccessToken ?? 'No token available');
	// create reusable transporter object using the default SMTP transport
	let transporter = nodemailer.createTransport({
		host: 'smtp.gmail.com',
		port: 465,
		secure: true, // MUST be true for port 465
		auth: {
			type: 'OAuth2',
			user: 'uprophetworld@gmail.com',
			clientId: process.env.OAUTH2_CLIENT_ID,
			clientSecret: process.env.OAUTH2_CLIENT_SECRET,
			refreshToken: process.env.OAUTH2_REFRESHTOKEN,
			accessToken: myAccessToken,
		},
		// Adding these specifically to handle the "Timeout"
		connectionTimeout: 30000, // 30 seconds
		greetingTimeout: 30000,
		socketTimeout: 30000,
		debug: true, // This will show more details in Railway logs
		logger: true,
	});
	// send mail with defined transport object
	await transporter.sendMail({
		from: '"Uprophet" <uprophetworld@gmail.com>', // sender address
		to: userEmail, // list of receivers
		subject: 'Uprophet Temporary Password', // Subject line
		html: `Hello ${username},<br><br>Here is your temporary password: <strong>${tempPassword}</strong> <br><br> <a href="https://uprophet.com/changepassword">Change Password</a>`, // html body
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
				user_registered: userreg,
			})
			.where('user_name', username);
		return randPass;
	} catch (err) {
		res.status(400).json('user name does not exist: ' + err);
	}
};

const forgotPassword = async (req, res, db, crypto, NONCE_SALT, SITE_KEY, nodemailer, myOAuth2Client) => {
	const { username, email } = req.body;
	try {
		const userEmail = await db('users').select('email').where('user_name', username);
		if (userEmail.length && userEmail[0].email !== email) {
			throw new Exception();
		}
		console.log('forogt userEmail found', userEmail);
		const { token } = await myOAuth2Client.getAccessToken();
		console.log('Token successfully fetched for email task');
		const tempPass = await changePassword(res, username, db, crypto, NONCE_SALT, SITE_KEY);
		console.log('tempPass created!', userEmail);
		await sendMail(username, userEmail[0].email, tempPass, nodemailer, token);
		console.log('email sent!');
		res.sendStatus(200);
	} catch (error) {
		console.error('DETAILED AUTH ERROR:', error); // This is the gold mine for debugging
		res.sendStatus(400);
	}
};

module.exports = { forgotPassword };
