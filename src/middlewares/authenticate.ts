import type { RequestHandler } from 'express';
import { apiResponse } from '../api-response.js';
import { User } from '../persistence/user/model.js';
import { verifyAccessToken } from '../features/auth/token.js';

export type AuthenticatedPrincipal = {
  userId: string;
  role: 'service_provider_admin' | 'employer_admin';
  employerId?: string;
};

declare global {
  namespace Express {
    interface Request {
      auth?: AuthenticatedPrincipal;
    }
  }
}

export const authenticateBearer: RequestHandler = async (req, res, next) => {
  const authorization = req.header('Authorization');
  if (!authorization) {
    res
      .status(401)
      .json(
        apiResponse({ success: false, status: 401, message: 'Missing token.' })
      );
    return;
  }
  const token = /^Bearer +(\S+)$/i.exec(authorization)?.[1];
  if (!token) {
    res.status(401).json(
      apiResponse({
        success: false,
        status: 401,
        message: 'Invalid authorization header.',
      })
    );
    return;
  }
  const userId = verifyAccessToken(token);
  if (!userId) {
    res
      .status(401)
      .json(
        apiResponse({ success: false, status: 401, message: 'Invalid token.' })
      );
    return;
  }

  const user = await User.findById(userId);
  if (!user) {
    res
      .status(401)
      .json(
        apiResponse({ success: false, status: 401, message: 'Invalid token.' })
      );
    return;
  }

  req.auth = {
    userId: String(user._id),
    role: user.role,
    ...(user.employer ? { employerId: String(user.employer) } : {}),
  };
  next();
};
