const compare = (userName, password, data, crypto, NONCE_SALT, SITE_KEY) => {
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
	return subpass === stopass;
};

const handleSignin = async (req, res, db, crypto, NONCE_SALT, SITE_KEY) => {
	const { userName, password } = req.body;
	if (!userName || !password) {
		res.status(400).json('incorrect form submission');
	}

	try {
		const data = await db('login').select('user_name', 'password', 'users_id', 'user_registered').where('user_name', userName);
		if (compare(userName, password, data, crypto, NONCE_SALT, SITE_KEY)) {
			res.status(200).json('yay!');
			// Create and assign a token
			// const token = jwt.sign({ id: user.id }, 'fewfew');

			// res.cookie('userId', token, { maxAge: 9000000, httpOnly: true });
			// res.status(202).send('Logged in!');
		} else {
			res.status(400).json('wrong credentials');
		}
	} catch {
		res.status(400).json('user does not exist.');
	}
};

module.exports = { handleSignin };
