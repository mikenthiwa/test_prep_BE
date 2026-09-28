import mongoose from 'mongoose';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { Employer } from './model.ts';
import type { EmployerRecord } from './model.ts';
import { useMongoMemoryServer } from '../../../tests/support/mongo.ts';

describe('Employer model', () => {
  const mongo = useMongoMemoryServer();

  beforeEach(async () => {
    await mongoose.connect(mongo.uri);
    await Employer.init();
  });

  afterEach(async () => {
    await Employer.deleteMany({});
    await mongoose.disconnect();
  });

  test('saves and retrieves an employer with an ObjectId and timestamps', async () => {
    const created = await Employer.create({ name: 'Acme', code: 'ACME' });
    const found = await Employer.findById(created._id);

    expect(created._id).toBeInstanceOf(mongoose.Types.ObjectId);
    expect(found?.name).toBe('Acme');
    expect(found?.code).toBe('ACME');
    expect(created.createdAt).toBeInstanceOf(Date);
    expect(created.updatedAt).toBeInstanceOf(Date);
  });

  test('trims the name and normalizes the code', async () => {
    const employer = await Employer.create({
      name: '  Acme Services  ',
      code: '  acme  ',
    });

    expect(employer.name).toBe('Acme Services');
    expect(employer.code).toBe('ACME');
  });

  test('defaults to active and accepts inactive status', async () => {
    const active = await Employer.create({ name: 'Acme', code: 'ACME' });
    const inactive = await Employer.create({
      name: 'Other',
      code: 'OTHER',
      status: 'inactive',
    });

    expect(active.status).toBe('active');
    expect(inactive.status).toBe('inactive');
  });

  test('rejects missing or blank names and codes', async () => {
    await expect(Employer.create({ code: 'ACME' })).rejects.toBeInstanceOf(
      mongoose.Error.ValidationError
    );
    await expect(Employer.create({ name: 'Acme' })).rejects.toBeInstanceOf(
      mongoose.Error.ValidationError
    );
    await expect(
      Employer.create({ name: '   ', code: '   ' })
    ).rejects.toBeInstanceOf(mongoose.Error.ValidationError);
  });

  test('rejects statuses outside active and inactive', async () => {
    await expect(
      Employer.create({
        name: 'Acme',
        code: 'ACME',
        // Simulate an untyped caller to exercise Mongoose's runtime validation.
        status: 'pending' as EmployerRecord['status'],
      })
    ).rejects.toBeInstanceOf(mongoose.Error.ValidationError);
  });

  test('rejects duplicate codes after normalization', async () => {
    await Employer.create({ name: 'Acme', code: 'ACME' });

    await expect(
      Employer.create({ name: 'Another Acme', code: ' acme ' })
    ).rejects.toMatchObject({ code: 11000 });
  });
});
