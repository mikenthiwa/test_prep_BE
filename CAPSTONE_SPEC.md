# Capstone spec — PRISMA_HR (Node.js Project)

## Problem statement

PRISMA_HR is a small, interview-focused backend inspired by the employee-lifecycle capabilities of PrismHR. It is an independent learning project and is not affiliated with or intended to reproduce PrismHR.

Employer-services organizations such as professional employer organizations (PEOs) support multiple employer clients. Each client needs accurate employee records, while the service provider needs controlled access across all clients. This MVP provides that shared employee-record foundation and deliberately postpones payroll processing and benefits administration.

## What success looks like (acceptance criteria)

- [ ] A seeded user can log in with valid credentials and receive a signed JWT; invalid credentials return `401`.
- [ ] Protected endpoints reject missing or invalid tokens with a consistent JSON error response.
- [ ] A service-provider administrator can create, list, and retrieve employers.
- [ ] An employer administrator cannot access another employer or any of its employees.
- [ ] An authorized user can create, list, retrieve, and update employee records for an accessible employer.
- [ ] Employee lists support pagination plus optional status and text-search filters.
- [ ] Employee number and email are unique within an employer, with duplicate values returning `409`.
- [ ] An active employee can be terminated with an effective date and optional reason.
- [ ] A terminated employee can be reactivated, clearing the termination fields.
- [ ] Invalid lifecycle transitions, request data, and resource identifiers return consistent JSON errors.
- [ ] Automated tests pass, TypeScript type-checks, and the production build emits runnable output to `dist`.

## Architecture sketch

- Express exposes version-ready REST routes and owns HTTP concerns.
- Route handlers delegate business rules to services rather than calling Mongoose directly.
- Mongoose models define persistence, indexes, and database-level constraints.
- Validation runs at the API boundary before service logic.
- Authentication middleware verifies JWTs; authorization middleware enforces roles and employer scope.
- Central error middleware maps known application errors to the shared error contract.
- Configuration reads environment variables for MongoDB, JWT signing, port, and seed credentials.

## Tech stack

- **Runtime and language:** Node.js with strict TypeScript and ES modules.
- **API:** Express.
- **Database:** MongoDB with Mongoose.
- **Authentication:** `jsonwebtoken` for JWTs and `bcryptjs` for password hashing.
- **Validation:** Zod request and environment schemas.
- **Testing:** Vitest, Supertest, and `mongodb-memory-server` for isolated MongoDB data.
- **Package manager:** pnpm 10.32.1.

## Task list

1. [ ] Complete TypeScript output configuration so `pnpm build` emits `dist/index.js` for `pnpm start:prod`.
2. [ ] Add environment validation and a reusable MongoDB connection module.
3. [ ] Create the User, Employer, and Employee Mongoose schemas, compound indexes, and TypeScript types.
4. [ ] Define request-validation schemas and the shared JSON error contract.
5. [ ] Implement password hashing, JWT login, and authentication middleware.
6. [ ] Implement role checks and employer-scope authorization.
7. [ ] Implement employer creation, listing, and retrieval.
8. [ ] Implement employee creation, listing, retrieval, and updates.
9. [ ] Implement employee pagination, status filtering, and text search.
10. [ ] Implement termination and reactivation with guarded state transitions.
11. [ ] Add centralized not-found and error middleware.
12. [ ] Add an idempotent seed command for one employer and the two demo users.
13. [ ] Add Vitest and Supertest integration tests backed by isolated MongoDB data.
14. [ ] Document environment variables, setup, seed, development, test, build, and production commands.
15. [ ] Run `pnpm test`, `pnpm exec tsc --noEmit`, and `pnpm build` and resolve all failures.

## Test scenarios

- Successful login, invalid password, unknown user, and missing token.
- Service-provider access across employers and employer-administrator access to the assigned employer.
- Rejection of cross-employer reads, writes, and lifecycle actions.
- Required fields, malformed identifiers, invalid compensation, and invalid pagination values.
- Employer code uniqueness and per-employer employee email and employee-number uniqueness.
- Employee creation, retrieval, partial update, filtered listing, text search, and pagination metadata.
- Active-to-terminated and terminated-to-active transitions, including rejected repeated transitions.
- Missing employer and employee responses plus the unexpected-error fallback.

## Out of scope for backend MVP

- Payroll calculations, pay runs, deductions, taxes, direct deposits, and pay statements.
- Benefit plans, eligibility, enrollment, carrier integrations, and retirement services.
- Time tracking, scheduling, leave, performance management, and applicant tracking.
- Employee self-service, password reset, email verification, and single sign-on.
- Public registration and user-management endpoints.
- Document storage, audit reporting, analytics, imports, and exports.
- A frontend, mobile application, production deployment, and third-party integrations.
- Permanent deletion of employee records.

## Fixed assumptions

- The first supported currency is `USD`, but every compensation record stores its currency.
- Compensation supports later payroll work but does not calculate gross or net pay.
- Employee email and employee number are unique within an employer rather than globally.
- Seeded accounts are for local development and automated tests only.
- Authorization is always enforced from the authenticated user's role and employer assignment; client-supplied tenant claims are not trusted.

## Open questions

- None for the current backend MVP.
