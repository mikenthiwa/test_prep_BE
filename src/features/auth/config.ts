export const JWT_ISSUER = 'prisma-hr-api';
export const JWT_AUDIENCE = 'prisma-hr-client';
export const ACCESS_TOKEN_SECONDS = 3600;

export class JwtConfigurationError extends Error {}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new JwtConfigurationError(
      'JWT_SECRET must have at least 32 characters'
    );
  }
  return secret;
}
