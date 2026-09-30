import mongoose from 'mongoose';
import { hash } from 'bcryptjs';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { createLoginRouter } from '../features/auth/login.ts';
import { authenticateBearer } from './authenticate.ts';
import { seedDemoAccounts } from '../persistence/seed-demo-accounts.ts';
import { errorHandler } from '../infrastructure/errors.ts';
import { Employer } from '../persistence/employer/model.ts';
import { User } from '../persistence/user/model.ts';
import { useMongoMemoryServer } from '../../tests/support/mongo.ts';

const secret = 'test-only-secret-longer-than-thirty-two-characters';
const failure = {
  success: false,
  status: 401,
  message: 'Sorry, something went wrong.',
};

function testApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/v1', createLoginRouter());
  app.get('/protected', authenticateBearer, (req, res) => res.json(req.auth));
  app.use(errorHandler);
  return app;
}

describe('login and Bearer authentication', () => {
  const mongo = useMongoMemoryServer();
  let originalSecret: string | undefined;

  beforeEach(async () => {
    originalSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = secret;
    await mongoose.connect(mongo.uri);
    await User.init();
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Employer.deleteMany({});
    await mongoose.disconnect();
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  test('logs in with normalized email and issues a signed one-hour token', async () => {
    const user = await User.create({
      email: 'admin@example.com',
      passwordHash: await hash('secret', 4),
      role: 'service_provider_admin',
    });
    const response = await request(testApp())
      .post('/api/v1/auth/login')
      .send({ email: '  ADMIN@EXAMPLE.COM  ', password: 'secret' });
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      status: 200,
      message: 'Login successful.',
      data: { tokenType: 'Bearer', expiresIn: 3600 },
    });
    const token = response.body.data.accessToken as string;
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256'],
      issuer: 'prisma-hr-api',
      audience: 'prisma-hr-client',
    });
    expect(decoded).toMatchObject({ sub: String(user._id) });
    expect(response.text).not.toContain('passwordHash');
    expect(response.text).not.toContain('secret');
  });

  test('returns the same generic 401 for wrong password and unknown user', async () => {
    await User.create({
      email: 'admin@example.com',
      passwordHash: await hash('correct', 4),
      role: 'service_provider_admin',
    });
    const app = testApp();
    const wrong = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@example.com', password: 'wrong' });
    const unknown = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'missing@example.com', password: 'wrong' });
    expect(wrong.status).toBe(401);
    expect(unknown.body).toEqual(wrong.body);
    expect(wrong.body).toEqual(failure);
  });

  test('limits the sixth login request per client and returns Retry-After', async () => {
    const app = testApp();
    for (let index = 0; index < 5; index++) {
      expect(
        (await request(app).post('/api/v1/auth/login').send({})).status
      ).toBe(400);
    }
    const response = await request(app).post('/api/v1/auth/login').send({});
    expect(response.status).toBe(429);
    expect(response.headers['retry-after']).toBeDefined();
    expect(response.body).toEqual({
      success: false,
      status: 429,
      message: 'Sorry, something went wrong.',
    });
  });

  test('accepts a valid token and loads the current role and employer', async () => {
    const employer = await Employer.create({ name: 'Acme', code: 'ACME' });
    const user = await User.create({
      email: 'admin@acme.com',
      passwordHash: await hash('secret', 4),
      role: 'employer_admin',
      employer: employer._id,
    });
    const token = jwt.sign({}, secret, {
      algorithm: 'HS256',
      subject: String(user._id),
      expiresIn: 3600,
      issuer: 'prisma-hr-api',
      audience: 'prisma-hr-client',
    });
    const response = await request(testApp())
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      userId: String(user._id),
      role: 'employer_admin',
      employerId: String(employer._id),
    });

    const mixedCase = await request(testApp())
      .get('/protected')
      .set('Authorization', `bEaReR   ${token}`);
    expect(mixedCase.status).toBe(200);
    expect(mixedCase.body).toEqual(response.body);
  });

  test('rejects unsupported schemes and malformed Bearer headers', async () => {
    const user = await User.create({
      email: 'admin@example.com',
      passwordHash: 'hash',
      role: 'service_provider_admin',
    });
    const token = jwt.sign({}, secret, {
      algorithm: 'HS256',
      subject: String(user._id),
      expiresIn: 3600,
      issuer: 'prisma-hr-api',
      audience: 'prisma-hr-client',
    });

    for (const header of [
      `Basic ${token}`,
      'Bearer',
      `Bearer ${token} extra`,
    ]) {
      const response = await request(testApp())
        .get('/protected')
        .set('Authorization', header);
      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        status: 401,
        message: 'Invalid authorization header.',
      });
    }
  });

  test('returns specific 401 messages for missing and invalid tokens', async () => {
    const user = await User.create({
      email: 'admin@example.com',
      passwordHash: 'hash',
      role: 'service_provider_admin',
    });
    const expired = jwt.sign({}, secret, {
      algorithm: 'HS256',
      subject: String(user._id),
      expiresIn: -1,
      issuer: 'prisma-hr-api',
      audience: 'prisma-hr-client',
    });
    const valid = jwt.sign({}, secret, {
      algorithm: 'HS256',
      subject: String(user._id),
      expiresIn: 3600,
      issuer: 'prisma-hr-api',
      audience: 'prisma-hr-client',
    });
    await user.deleteOne();
    const app = testApp();
    for (const [header, message] of [
      [undefined, 'Missing token.'],
      ['Bearer garbage', 'Invalid token.'],
      [`Bearer ${expired}`, 'Invalid token.'],
      [`Bearer ${valid}`, 'Invalid token.'],
    ] as const) {
      const pending = request(app).get('/protected');
      if (header) pending.set('Authorization', header);
      const response = await pending;
      expect(response.status).toBe(401);
      expect(response.body).toEqual({ success: false, status: 401, message });
    }
  });

  test('seeds one employer and both roles idempotently', async () => {
    const options = {
      providerEmail: 'provider@example.com',
      providerPassword: 'provider-pass',
      employerEmail: 'employer@example.com',
      employerPassword: 'employer-pass',
    };
    await seedDemoAccounts(options);
    await seedDemoAccounts(options);
    expect(await Employer.countDocuments({ code: 'DEMO' })).toBe(1);
    expect(await User.countDocuments()).toBe(2);
    const provider = await User.findOne({
      email: options.providerEmail,
    }).select('+passwordHash');
    expect(provider?.role).toBe('service_provider_admin');
    expect(provider?.passwordHash).not.toBe(options.providerPassword);
  }, 20_000);
});
