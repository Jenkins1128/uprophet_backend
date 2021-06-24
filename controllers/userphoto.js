const uploadPhoto = async (req, res, db) => {
	const { name, data, userName } = req.files.pic;
	if (!name || !data || !userName) {
		return res.status(400).json('form incomplete');
	}
	try {
		await db('users')
			.update({
				photo_name: name,
				photo: data
			})
			.where('user_name', userName);
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
