import { Request, Response } from 'express';
import { Knex } from 'knex';

// The payload returned by accessTokenPayload
export interface TokenPayload {
	id: number;
	username: string;
}

// JWT module type
export type JwtModule = typeof import('jsonwebtoken');

// Signature of the accessTokenPayload helper function
export type AccessTokenPayloadFn = (
	req: Request,
	res: Response,
	jwt: JwtModule,
	db: Knex
) => Promise<TokenPayload>;

// Common node crypto module type
export type CryptoModule = typeof import('crypto');
