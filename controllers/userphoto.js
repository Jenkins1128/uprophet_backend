const uploadPhoto = async (req, res, db, jwt, refreshToken) => {
	const { name, image } = req.body;
	if (!name || !image) {
		return res.status(400).json('form incomplete');
	}
	console.log('photo name: ', name);
	try {
		const { username } = await refreshToken(req, res, jwt, db);
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
	console.log(username);
	try {
		const img = await db('users').select('photo').where('user_name', username);

		const buffer = img[0]['photo'];
		//console.log(buffer);
		if (img) {
			res.json({ photo: buffer.toString() });
		} else {
			res.status(400).json('No such image');
		}
	} catch (error) {
		res.status(400).json(error);
	}
};

module.exports = { uploadPhoto, fetchPhoto };
