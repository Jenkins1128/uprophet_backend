const fetchExplore = async (res, db) => {
	const trx = await db.transaction();
	try {
		const randomQuoteIds = await trx('quotes').select('*').orderByRaw('RAND()').limit(20);
		res.json(randomQuoteIds);
		await trx.commit;
	} catch (error) {
		await trx.rollback;
		res.status(400).json(error.toString());
	}
};

module.exports = {
	fetchExplore
};
