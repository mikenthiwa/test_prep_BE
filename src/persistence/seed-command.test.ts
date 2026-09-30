import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import mongoose from 'mongoose';
import { compare } from 'bcryptjs';
import { describe, expect, test } from 'vitest';
import { User } from './user/model.ts';
import { Employer } from './employer/model.ts';
import { useMongoMemoryServer } from '../../tests/support/mongo.ts';

const run = promisify(execFile);

describe('explicit demo seed command', () => {
  const mongo = useMongoMemoryServer();

  test('is idempotent and keeps credentials out of output', async () => {
    const env = {
      ...process.env,
      MONGODB_URI: mongo.uri,
      SEED_PROVIDER_EMAIL: 'provider@example.com',
      SEED_PROVIDER_PASSWORD: 'provider-test-password',
      SEED_EMPLOYER_EMAIL: 'employer@example.com',
      SEED_EMPLOYER_PASSWORD: 'employer-test-password',
    };
    const command = async () =>
      run(process.execPath, ['--import', 'tsx', 'src/persistence/seed.ts'], {
        env,
        cwd: process.cwd(),
        timeout: 15_000,
      });
    const first = await command();
    const second = await command();
    const output = first.stdout + first.stderr + second.stdout + second.stderr;
    expect(output).not.toContain(env.SEED_PROVIDER_PASSWORD);
    expect(output).not.toContain(env.SEED_EMPLOYER_PASSWORD);

    await mongoose.connect(mongo.uri);
    try {
      expect(await Employer.countDocuments({ code: 'DEMO' })).toBe(1);
      expect(await User.countDocuments()).toBe(2);
      const provider = await User.findOne({
        email: env.SEED_PROVIDER_EMAIL,
      }).select('+passwordHash');
      const employer = await User.findOne({
        email: env.SEED_EMPLOYER_EMAIL,
      }).select('+passwordHash');
      expect(provider?.role).toBe('service_provider_admin');
      expect(employer?.role).toBe('employer_admin');
      expect(employer?.employer).toBeDefined();
      expect(
        await compare(env.SEED_PROVIDER_PASSWORD, provider!.passwordHash)
      ).toBe(true);
      expect(
        await compare(env.SEED_EMPLOYER_PASSWORD, employer!.passwordHash)
      ).toBe(true);
    } finally {
      await mongoose.disconnect();
    }

    await mongoose.connect(mongo.uri);
    await Employer.updateOne(
      { code: 'DEMO' },
      { $set: { name: 'Conflicting Employer' } }
    );
    await mongoose.disconnect();
    const conflict = await command().then(
      () => null,
      (error: Error & { stdout: string; stderr: string }) => error
    );
    expect(conflict).not.toBeNull();
    expect(conflict!.stdout + conflict!.stderr).toContain('employer_conflict');
    expect(conflict!.stdout + conflict!.stderr).not.toContain(
      env.SEED_PROVIDER_PASSWORD
    );
  }, 40_000);
});
