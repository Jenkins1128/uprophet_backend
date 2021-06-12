const saveBio = async (req, res, db) => {
	const { userName, bio } = req.body;
	if (!userName || !bio) {
		return res.status(400).json('form incomplete');
	}
	try {
		await db('users')
			.update({
				bio: bio
			})
			.where('user_name', userName);
		res.sendStatus(200);
	} catch (error) {
		res.sendStatus(400);
	}
};

const fetchBio = async (req, res, db) => {
	const { userName } = req.body;
	try {
		const bio = await db('users').select('bio').where('user_name', userName);
		if (bio.length) {
			res.json(bio);
		}
	} catch (error) {
		res.status(400).json(error);
	}
};

module.exports = { saveBio, fetchBio };
