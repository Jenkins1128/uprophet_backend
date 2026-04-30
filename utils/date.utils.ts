/**
 * Returns a formatted date string suitable for MySQL (YYYY-MM-DD HH:MM:SS).
 */
export const getDbTimestamp = (): string => {
	// Standardizing on 'sv-SE' locale which gives YYYY-MM-DD HH:MM:SS
	// This works well across environments and is what was used in the original code
	return process.env.NODE_ENV === 'production' ? new Date().toISOString().replace('T', ' ').slice(0, 19): new Date().toLocaleString('sv-SE').slice(0, 19);
};
