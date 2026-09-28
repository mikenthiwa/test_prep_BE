import mongoose from 'mongoose';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { Employer } from '../employer/model.ts';
import { User } from './model.ts';
import type { UserRecord } from './model.ts';
import { useMongoMemoryServer } from '../../../tests/support/mongo.ts';

describe('User model', () => {
  const mongo = useMongoMemoryServer();

  beforeEach(async () => {
    await mongoose.connect(mongo.uri);
    await User.init();
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Employer.deleteMany({});
    await mongoose.disconnect();
  });

  test('saves a service-provider admin without an employer', async () => {
    const created = await User.create({
      email: 'admin@example.com',
      passwordHash: 'stored-hash',
      role: 'service_provider_admin',
    });
    const found = await User.findById(created._id);

    expect(created._id).toBeInstanceOf(mongoose.Types.ObjectId);
    expect(found?.email).toBe('admin@example.com');
    expect(found?.role).toBe('service_provider_admin');
    expect(found?.employer).toBeUndefined();
    expect(created.createdAt).toBeInstanceOf(Date);
    expect(created.updatedAt).toBeInstanceOf(Date);
  });

  test('saves an employer admin assigned to an employer', async () => {
    const employer = await Employer.create({ name: 'Acme', code: 'ACME' });
    const user = await User.create({
      email: 'admin@acme.com',
      passwordHash: 'stored-hash',
      role: 'employer_admin',
      employer: employer._id,
    });

    expect(user.employer).toEqual(employer._id);
  });

  test('requires an employer for an employer admin', async () => {
    await expect(
      User.create({
        email: 'admin@acme.com',
        passwordHash: 'stored-hash',
        role: 'employer_admin',
      })
    ).rejects.toBeInstanceOf(mongoose.Error.ValidationError);
  });

  test('rejects an employer assignment for a service-provider admin', async () => {
    const employer = await Employer.create({ name: 'Acme', code: 'ACME' });

    await expect(
      User.create({
        email: 'admin@example.com',
        passwordHash: 'stored-hash',
        role: 'service_provider_admin',
        employer: employer._id,
      })
    ).rejects.toBeInstanceOf(mongoose.Error.ValidationError);
  });

  test('requires email, password hash, and role', async () => {
    await expect(
      User.create({
        passwordHash: 'stored-hash',
        role: 'service_provider_admin',
      })
    ).rejects.toBeInstanceOf(mongoose.Error.ValidationError);
    await expect(
      User.create({
        email: 'admin@example.com',
        role: 'service_provider_admin',
      })
    ).rejects.toBeInstanceOf(mongoose.Error.ValidationError);
    await expect(
      User.create({ email: 'admin@example.com', passwordHash: 'stored-hash' })
    ).rejects.toBeInstanceOf(mongoose.Error.ValidationError);
    await expect(
      User.create({
        email: '   ',
        passwordHash: 'stored-hash',
        role: 'service_provider_admin',
      })
    ).rejects.toBeInstanceOf(mongoose.Error.ValidationError);
  });

  test('rejects unsupported roles', async () => {
    await expect(
      User.create({
        email: 'admin@example.com',
        passwordHash: 'stored-hash',
        // Simulate an untyped caller to exercise Mongoose's runtime validation.
        role: 'employee' as UserRecord['role'],
      })
    ).rejects.toBeInstanceOf(mongoose.Error.ValidationError);
  });

  test('normalizes email and rejects duplicates globally', async () => {
    const user = await User.create({
      email: '  ADMIN@Example.com  ',
      passwordHash: 'stored-hash',
      role: 'service_provider_admin',
    });

    expect(user.email).toBe('admin@example.com');
    await expect(
      User.create({
        email: 'admin@example.com',
        passwordHash: 'another-hash',
        role: 'service_provider_admin',
      })
    ).rejects.toMatchObject({ code: 11000 });
  });

  test('excludes password hashes from queries unless explicitly selected', async () => {
    const created = await User.create({
      email: 'admin@example.com',
      passwordHash: 'stored-hash',
      role: 'service_provider_admin',
    });

    const defaultResult = await User.findById(created._id);
    const selectedResult = await User.findById(created._id).select(
      '+passwordHash'
    );

    expect(defaultResult?.passwordHash).toBeUndefined();
    expect(selectedResult?.passwordHash).toBe('stored-hash');
  });
});
