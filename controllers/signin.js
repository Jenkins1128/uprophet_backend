const compare = (username, password, data, crypto, NONCE_SALT, SITE_KEY) => {
	const storeg = data[0].user_registered;
	//The hashed password of the stored matching user
	const stopass = data[0].password;
	//Recreate our NONCE used at registration
	const nonce = crypto
		.createHash('md5')
		.update('registration-' + username + storeg + NONCE_SALT)
		.digest('hex');
	//Rehash the submitted password to see if it matches the stored hash
	const subpass = crypto
		.createHmac('sha512', SITE_KEY)
		.update(password + nonce)
		.digest('hex');
	return subpass === stopass;
};

const logout = async (req, res, jwt, db) => {
	try {
		const { username } = await refreshToken(req, res, jwt, db);
		await db('users').update('refresh_token', '').where('user_name', username);
		res.clearCookie('upUserId');
		res.sendStatus(204);
	} catch (error) {
		res.sendStatus(500);
	}
};

const refreshToken = async (req, res, jwt, db) => {
	let accessToken = req.cookies.upUserId;
	console.log(accessToken);
	if (!accessToken) {
		return res.status(403).send();
	}

	//verify the acess token
	try {
		jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
		const base64Payload = accessToken.split('.')[1];
		console.log('ACCESS TOKEN VERIFIED base64Payload: ' + base64Payload);
		const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString('utf-8'));
		return payload;
	} catch {
		console.log('ACCESS TOKEN FAILED base64Payload');
	}

	const base64Payload = accessToken.split('.')[1];

	const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString('utf-8'));

	console.log('payload: ' + payload);
	//retrieve the refresh token from database
	let refreshToken;
	try {
		refreshToken = await db('users').select('refresh_token').where('user_name', payload.username);
	} catch (error) {
		return res.sendStatus(400);
	}

	if (!refreshToken.length) {
		return res.sendStatus(403);
	}
	console.log('refreshToken', refreshToken[0].refresh_token);

	//verify the refresh token
	try {
		jwt.verify(refreshToken[0].refresh_token, process.env.REFRESH_TOKEN_SECRET);
	} catch (e) {
		return res.sendStatus(403);
	}

	let newToken = jwt.sign({ id: payload.id, username: payload.username }, process.env.ACCESS_TOKEN_SECRET, {
		algorithm: 'HS256',
		expiresIn: process.env.ACCESS_TOKEN_LIFE
	});
	console.log('newToken ' + newToken);
	//res.setHeader('Set-Cookie', cookie.serialize('upUserId', newToken, { httpOnly: true }));
	res.cookie('upUserId', newToken, { httpOnly: true });
	const base64Payload2 = newToken.split('.')[1];
	const newTokenPayload = JSON.parse(Buffer.from(base64Payload2, 'base64').toString('utf-8'));
	console.log('newTokenPayload: ' + newTokenPayload);
	return newTokenPayload;
};

const handleSignin = async (req, res, db, crypto, NONCE_SALT, SITE_KEY, jwt) => {
	const { username, password } = req.body;
	if (!username || !password) {
		return res.status(400).json('incorrect form submission');
	}

	const trx = await db.transaction();
	try {
		const data = await trx('login').select('user_name', 'password', 'users_id', 'user_registered').where('user_name', username);
		if (compare(username, password, data, crypto, NONCE_SALT, SITE_KEY)) {
			const payload = { id: data[0].users_id, username: data[0].user_name };

			const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
				algorithm: 'HS256',
				expiresIn: process.env.ACCESS_TOKEN_LIFE
			});

			const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
				algorithm: 'HS256',
				expiresIn: process.env.REFRESH_TOKEN_LIFE
			});

			await trx('users').update('refresh_token', refreshToken).where('user_name', username);

			res.cookie('upUserId', accessToken, { httpOnly: true });
			res.sendStatus(200);
		} else {
			res.sendStatus(401);
		}
		await trx.commit();
	} catch (err) {
		await trx.rollback();
		res.sendStatus(401);
	}
};

module.exports = { handleSignin, refreshToken, logout };
