const saveBio = async (req, res, db, jwt, accessTokenPayload) => {
	const { bio } = req.body;
	try {
		const { username } = await accessTokenPayload(req, res, jwt, db);
		await db('users')
			.update({
				bio: bio
			})
			.where('user_name', username);
		res.sendStatus(200);
	} catch (error) {
		res.sendStatus(400);
	}
};

module.exports = { saveBio };
