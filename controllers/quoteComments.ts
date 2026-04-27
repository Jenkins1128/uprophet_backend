import { Request, Response } from 'express';
import { eq, desc } from 'drizzle-orm';
import type { Database } from '../db';
import { comments, quoteNotifications } from '../db/schema';
import { JwtModule, AccessTokenPayloadFn } from '../types';

const fetchComments = async (req: Request, res: Response, db: Database): Promise<void> => {
	const { quoteId } = req.body;
	try {
		const commentDetails = await db.select().from(comments)
			.where(eq(comments.quotesId, quoteId))
			.orderBy(desc(comments.id));
		res.json(commentDetails);
	} catch (error) {
		res.sendStatus(400);
	}
};

const addComment = async (req: Request, res: Response, db: Database, jwt: JwtModule, accessTokenPayload: AccessTokenPayloadFn): Promise<void> => {
	const { quoteId, comment } = req.body;
	const date = process.env.NODE_ENV === 'production'
		? new Date().toISOString().replace('T', ' ').substr(0, 19)
		: new Date().toLocaleString('sv-SE').slice(0, 19);
	try {
		const { username } = await accessTokenPayload(req, res, jwt, db);
		await db.transaction(async (tx) => {
			const result = await tx.insert(comments).values({
				quotesId: quoteId,
				comment: comment,
				commenter: username,
				datePosted: date,
			}).$returningId();

			await tx.insert(quoteNotifications).values({
				notice: `${username} commented on your quote.`,
				quotesId: quoteId,
				date: date,
			});

			const addedComment = await tx.select().from(comments).where(eq(comments.id, (result[0] as { id: number }).id));
			res.json({ ...addedComment[0] });
		});
	} catch {
		res.sendStatus(400);
	}
};

export { fetchComments, addComment };
