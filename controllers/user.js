const getUser = async (req, res, db, jwt, refreshToken) => {
	try {
		//get user from access token
		const { username } = await refreshToken(req, res, jwt, db);
		res.json(username);
	} catch (error) {
		res.sendStatus(400);
	}
};

module.exports = { getUser };
