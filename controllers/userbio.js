const saveBio = async (req, res, db, jwt, refreshToken) => {
	const { bio } = req.body;
	if (!bio) {
		return res.status(400).json('form incomplete');
	}
	try {
		const { username } = await refreshToken(req, res, jwt, db);
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
