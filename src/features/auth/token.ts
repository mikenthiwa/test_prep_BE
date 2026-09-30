import jwt from 'jsonwebtoken';
import {
  ACCESS_TOKEN_SECONDS,
  getJwtSecret,
  JWT_AUDIENCE,
  JWT_ISSUER,
} from './config.js';

export function signAccessToken(userId: string): string {
  return jwt.sign({}, getJwtSecret(), {
    algorithm: 'HS256',
    subject: userId,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    expiresIn: ACCESS_TOKEN_SECONDS,
  });
}

export function verifyAccessToken(token: string): string | null {
  const secret = getJwtSecret();
  try {
    const claims = jwt.verify(token, secret, {
      algorithms: ['HS256'],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    return typeof claims === 'object' &&
      typeof claims.exp === 'number' &&
      Number.isFinite(claims.exp) &&
      typeof claims.sub === 'string' &&
      /^[0-9a-f]{24}$/i.test(claims.sub)
      ? claims.sub
      : null;
  } catch (error) {
    if (
      error instanceof jwt.JsonWebTokenError ||
      error instanceof jwt.NotBeforeError
    )
      return null;
    throw error;
  }
}
