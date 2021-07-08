const getUser = async (req, res, db, jwt, accessTokenPayload) => {
	try {
		//get user from access token
		const { username } = await accessTokenPayload(req, res, jwt, db);
		res.json(username);
	} catch (error) {
		res.sendStatus(error.message);
	}
};

module.exports = { getUser };
