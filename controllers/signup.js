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

const handleSignup = async (req, res, db, crypto, NONCE_SALT, SITE_KEY) => {
	const { username, name, email, password } = req.body;
	if (!username || !email || !name || !password || !username.length || !email.length || !name.length || !password.length) {
		return res.status(400).json('incorrect form submission');
	}
	const userreg = new Date().getTime();
	const hash = hashPass(username, password, userreg, crypto, NONCE_SALT, SITE_KEY);

	const trx = await db.transaction();
	try {
		const usersId = await trx('users').insert({
			name: name,
			user_name: username,
			email: email
		});
		const loginsId = await trx('login').insert({
			password: hash,
			user_name: username,
			users_id: usersId[0],
			user_registered: userreg
		});

		if (loginsId.length) {
			res.json(loginsId[0]);
		}
		await trx.commit();
	} catch (err) {
		await trx.rollback();
		res.sendStatus(400);
	}
};

module.exports = {
	handleSignup
};
