const fetchFavoriting = async (req, res, db) => {
	const { userName } = req.params;
	try {
		const allFavoriting = await db('favoriting').select('to_user').where('from_user', userName);
		res.json(allFavoriting);
	} catch {
		res.sendStatus(400);
	}
};

module.exports = { fetchFavoriting };
