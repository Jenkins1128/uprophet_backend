const handleSignin = (req, res, db, bcrypt, crypto, NONCE_SALT, SITE_KEY, SqlString) => {
	const { userName, password } = req.body;
	if (!userName || !password) {
		res.status(400).json('incorrect form submission');
	}
	console.log(userName, userName.length);

	db.select('user_name', 'password', 'users_id', 'user_registered')
		.where('user_name', userName)
		.from('login')
		.then((data) => {
			//The registration date of the stored matching user
			const storeg = data[0].user_registered;
			//The hashed password of the stored matching user
			const stopass = data[0].password;
			//Recreate our NONCE used at registration
			const nonce = crypto
				.createHash('md5')
				.update('registration-' + userName + storeg + NONCE_SALT)
				.digest('hex');
			//Rehash the submitted password to see if it matches the stored hash
			const subpass = crypto
				.createHmac('sha512', SITE_KEY)
				.update(password + nonce)
				.digest('hex');

			console.log('subpass', subpass);
			console.log('stopass', stopass);
			//const isValid = bcrypt.compareSync(password, data[0].password);
			if (subpass === stopass) {
				res.status(200).json('yay!');
			} else {
				res.status(400).json('wrong credentials');
			}
		})
		.catch(() => res.status(400).json('user does not exist.'));
};

module.exports = { handleSignin };
