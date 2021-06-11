const fetchFavoriters = async (req, res, db) => {
	const { userName } = req.params;
	try {
		const allFavoriters = await db('favoriting').select('from_user').where('to_user', userName);
		res.json(allFavoriters);
	} catch {
		res.sendStatus(400);
	}
};

module.exports = { fetchFavoriters };
