import { compare, hashSync } from 'bcryptjs';
import type { RequestHandler } from 'express';
import { z } from 'zod';
import { apiResponse } from '../../../api-response.js';
import { User } from '../../../persistence/user/model.js';
import { ACCESS_TOKEN_SECONDS } from '../config.js';
import { signAccessToken } from '../token.js';

const loginFailureMessage = 'Sorry, something went wrong.';
const dummyPasswordHash = hashSync('not-a-real-account-password', 12);
export const loginRequestSchema = z.strictObject({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1),
});

const LoginHandler: RequestHandler = async (req, res) => {
  const result = loginRequestSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json(
      apiResponse({
        success: false,
        status: 400,
        message: loginFailureMessage,
      })
    );
    return;
  }

  const user = await User.findOne({ email: result.data.email }).select(
    '+passwordHash'
  );
  const passwordMatches = await compare(
    result.data.password,
    user?.passwordHash ?? dummyPasswordHash
  );
  if (!user || !passwordMatches) {
    res.status(401).json(
      apiResponse({
        success: false,
        status: 401,
        message: loginFailureMessage,
      })
    );
    return;
  }

  res.status(200).json(
    apiResponse({
      success: true,
      status: 200,
      message: 'Login successful.',
      data: {
        accessToken: signAccessToken(String(user._id)),
        tokenType: 'Bearer',
        expiresIn: ACCESS_TOKEN_SECONDS,
      },
    })
  );
};

export default LoginHandler;
