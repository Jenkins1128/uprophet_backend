const sendMail = async (username, userEmail, tempPassword, nodemailer) => {
	// Generate test SMTP service account from ethereal.email
	// Only needed if you don't have a real mail account for testing
	let testAccount = await nodemailer.createTestAccount();

	// create reusable transporter object using the default SMTP transport
	let transporter = nodemailer.createTransport({
		host: 'smtp.ethereal.email',
		port: 587,
		secure: false, // true for 465, false for other ports
		auth: {
			user: testAccount.user, // generated ethereal user
			pass: testAccount.pass // generated ethereal password
		}
	});

	// send mail with defined transport object
	let info = await transporter.sendMail({
		from: '"Uprophet" <uprophetworld@gmail.com>', // sender address
		to: userEmail, // list of receivers
		subject: 'Uprophet Temporary Password', // Subject line
		text: `Temporary Password: ${tempPassword}`, // plain text body
		html: `<b><strong>${tempPassword}</strong></b>` // html body
	});

	console.log('Message sent: %s', info.messageId);
	// Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

	// Preview only available when sending through an Ethereal account
	console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
	// Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
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
	console.log('randPass: ', randPass);
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
	const { username } = req.body;
	console.log(username);
	try {
		const tempPass = await changePassword(res, username, db, crypto, NONCE_SALT, SITE_KEY);
		console.log('tempPass ', tempPass);
		const userEmail = await db('users').select('email').where('user_name', username);
		await sendMail(username, userEmail[0].email, tempPass, nodemailer);
		res.sendStatus(200);
		//send pass to email
	} catch (error) {
		res.sendStatus(400);
	}
};

module.exports = { forgotPassword };
