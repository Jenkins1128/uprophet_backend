const uploadPhoto = async (req, res, db, jwt, accessTokenPayload) => {
	const { name, image } = req.body;
	try {
		const { username } = await accessTokenPayload(req, res, jwt, db);
		await db('users')
			.update({
				photo_name: name,
				photo: image
			})
			.where('user_name', username);
		res.sendStatus(200);
	} catch (error) {
		res.sendStatus(400);
	}
};

const fetchPhoto = async (req, res, db) => {
	const { username } = req.body;
	try {
		const img = await db('users').select('photo').where('user_name', username);
		const buffer = img[0]['photo'];
		if (img) {
			res.json({ photo: buffer.toString() });
		} else {
			res.sendStatus(400);
		}
	} catch {
		res.sendStatus(400);
	}
};

module.exports = { uploadPhoto, fetchPhoto };
