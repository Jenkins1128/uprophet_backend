/**
 * Returns a formatted date string suitable for MySQL (YYYY-MM-DD HH:MM:SS) in UTC.
 */
export const getDbTimestamp = (): string => {
	// toISOString() always returns UTC — consistent in all environments
	return new Date().toISOString().replace('T', ' ').slice(0, 19);
};
