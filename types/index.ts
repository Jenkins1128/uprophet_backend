import { Request, Response } from 'express';
import { Knex } from 'knex';
import * as jwt from 'jsonwebtoken';

// The payload returned by accessTokenPayload
export interface TokenPayload {
	id: number;
	username: string;
}

// Signature of the accessTokenPayload helper function
export type AccessTokenPayloadFn = (
	req: Request,
	res: Response,
	jwt: typeof import('jsonwebtoken'),
	db: Knex
) => Promise<TokenPayload>;

// Common node crypto module type
export type CryptoModule = typeof import('crypto');
