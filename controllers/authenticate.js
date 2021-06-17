const verify = (req, res, jwt, next) => {
	const accessToken = req.cookies.jwt;
	//if there is no token stored in cookies, the request is unauthorized

	if (!accessToken) {
		return res.sendStatus(403);
	}

	let payload;
	try {
		//use the jwt.verify method to verify the access token
		//throws an error if the token has expired or has a invalid signature
		payload = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
		next();
	} catch (error) {
		//if an error occured return request unauthorized error
		return res.sendStatus(401);
	}
};

module.exports = { verify };
