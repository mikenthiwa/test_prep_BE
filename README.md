# PublicPulse Backend

## Description

## Table of Contents

- [Documentation](#documentation)
- [Setup](#setup)
  - [Dependencies](#dependencies)
  - [Getting Started](#getting-started)
  - [Environment Variables](#environment-variables)
  - [Database and ORM](#database-and-orm)
  - [Run the Service Using Docker](#run-the-service-using-docker)
- [Testing](#testing)
- [Logging](#logging)
- [Contribute](#contribute)
- [Deployment](#deployment)
- [License](#license)
- [Project Structure](#project-structure)

## Documentation

See [CAPSTONE.md](CAPSTONE_SPEC.md) for project context.

## Setup

### Dependencies

- Node.js
- Express
- pnpm

### Getting Started

Install dependencies:

```bash
pnpm install --frozen-lockfile
```

## Testing

Run the test suite once with `pnpm test`, or keep it running during development with `pnpm test:watch`.
Use `pnpm typecheck:test` to type-check test files and `pnpm exec tsc --noEmit` to type-check application code.
HTTP tests use Supertest, while database tests use an isolated `mongodb-memory-server` instance.
The first database test run may download a MongoDB binary; no local MongoDB service is needed for tests.

## Logging

The server writes one JSON log line when it starts and one when each HTTP request completes. `pnpm start:dev` formats those lines with `pino-pretty` for local reading; production output stays JSON. Request logs include the method, path, status code, response time in milliseconds, and a generated request ID. The same ID is returned in the `X-Request-Id` response header. Incoming request IDs are not reused.

Logs omit request and response bodies, headers, and URL query values. HTTP responses below 400 log at `info`, 4xx responses at `warn`, and 5xx responses at `error`.

## Contribute

## Deployment

## License

## Project Structure
