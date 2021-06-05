const hashPass = (userName, password, userreg, crypto, NONCE_SALT, SITE_KEY) => {
	const nonce = crypto
		.createHash('md5')
		.update('registration-' + userName + userreg + NONCE_SALT)
		.digest('hex');
	const userpass = crypto
		.createHmac('sha512', SITE_KEY)
		.update(password + nonce)
		.digest('hex');
	return userpass;
};

const handleSignup = (req, res, db, crypto, NONCE_SALT, SITE_KEY) => {
	const { userName, name, email, password } = req.body;
	if (!userName || !email || !name || !password) {
		return res.status(400).json('incorrect form submission');
	}
	const userreg = new Date().getTime();
	const hash = hashPass(userName, password, userreg, crypto, NONCE_SALT, SITE_KEY);
	db.transaction((trx) => {
		trx.insert({
			name: name,
			user_name: userName,
			email: email
		})
			.into('users')
			.then((data) => {
				console.log(data);
				return trx('login')
					.insert({
						password: hash,
						user_name: userName,
						users_id: data[0],
						user_registered: userreg
					})
					.then((user) => {
						res.json(user[0]);
					});
			})
			.then(trx.commit)
			.catch(trx.rollback);
	}).catch((err) => res.status(400).json('unable to register: ' + err));
};

module.exports = {
	handleSignup
};
