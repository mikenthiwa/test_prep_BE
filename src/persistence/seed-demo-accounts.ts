import { hash } from 'bcryptjs';
import { z } from 'zod';
import { Employer } from './employer/model.js';
import { User } from './user/model.js';

const seedSchema = z.strictObject({
  providerEmail: z.email(),
  providerPassword: z.string().min(1),
  employerEmail: z.email(),
  employerPassword: z.string().min(1),
});

export type DemoSeedOptions = z.infer<typeof seedSchema>;

export class DemoSeedError extends Error {
  constructor(readonly reason: string) {
    super(reason);
  }
}

export async function seedDemoAccounts(
  options: DemoSeedOptions
): Promise<void> {
  const parsed = seedSchema.safeParse(options);
  if (!parsed.success) throw new DemoSeedError('invalid_seed_config');
  const config = parsed.data;
  const providerEmail = config.providerEmail.trim().toLowerCase();
  const employerEmail = config.employerEmail.trim().toLowerCase();
  if (providerEmail === employerEmail)
    throw new DemoSeedError('duplicate_seed_emails');

  let employer = await Employer.findOne({ code: 'DEMO' });
  if (employer && employer.name !== 'Demo Employer')
    throw new DemoSeedError('employer_conflict');

  const provider = await User.findOne({ email: providerEmail });
  const employerAdmin = await User.findOne({ email: employerEmail });
  if (
    provider &&
    (provider.role !== 'service_provider_admin' || provider.employer)
  ) {
    throw new DemoSeedError('provider_conflict');
  }
  if (
    employerAdmin &&
    (employerAdmin.role !== 'employer_admin' ||
      !employer ||
      String(employerAdmin.employer) !== String(employer._id))
  ) {
    throw new DemoSeedError('employer_admin_conflict');
  }

  employer ??= await Employer.create({ name: 'Demo Employer', code: 'DEMO' });
  if (!provider) {
    await User.create({
      email: providerEmail,
      passwordHash: await hash(config.providerPassword, 12),
      role: 'service_provider_admin',
    });
  }
  if (!employerAdmin) {
    await User.create({
      email: employerEmail,
      passwordHash: await hash(config.employerPassword, 12),
      role: 'employer_admin',
      employer: employer._id,
    });
  }
}

export function seedOptionsFromEnv(env: NodeJS.ProcessEnv): DemoSeedOptions {
  const values = {
    providerEmail: env.SEED_PROVIDER_EMAIL,
    providerPassword: env.SEED_PROVIDER_PASSWORD,
    employerEmail: env.SEED_EMPLOYER_EMAIL,
    employerPassword: env.SEED_EMPLOYER_PASSWORD,
  };
  const result = seedSchema.safeParse(values);
  if (!result.success) throw new DemoSeedError('invalid_seed_config');
  return result.data;
}
