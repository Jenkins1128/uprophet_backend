const sendMail = async (username, userEmail, tempPassword, nodemailer, myAccessToken) => {
	console.log("Attempting to send mail. Token type:", typeof myAccessToken);
	// create reusable transporter object using the default SMTP transport
	let transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			type: 'OAuth2',
			user: 'uprophetworld@gmail.com', //your gmail account you used to set the project up in google cloud console"
			clientId: process.env.OAUTH2_CLIENT_ID,
			clientSecret: process.env.OAUTH2_CLIENT_SECRET,
			refreshToken: process.env.OAUTH2_REFRESHTOKEN,
			accessToken: myAccessToken
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

const forgotPassword = async (req, res, db, crypto, NONCE_SALT, SITE_KEY, nodemailer, myAccessToken) => {
	const { username, email } = req.body;
	try {
		const userEmail = await db('users').select('email').where('user_name', username);
		if (userEmail.length && userEmail[0].email !== email) {
			throw new Exception();
		}
		console.log("forogt userEmail found", userEmail);
		const tempPass = await changePassword(res, username, db, crypto, NONCE_SALT, SITE_KEY);
		console.log("tempPass created!", userEmail);
		await sendMail(username, userEmail[0].email, tempPass, nodemailer, myAccessToken);
		console.log("email sent!");
		res.sendStatus(200);
	} catch (error) {
		console.error("DETAILED AUTH ERROR:", error); // This is the gold mine for debugging
		res.status(400).json({
			message: "Email failed to send",
			error: error.message // Sending this back to the frontend helps you see the cause in DevTools
		});
	}
};

module.exports = { forgotPassword };
