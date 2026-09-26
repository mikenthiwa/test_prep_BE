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

## Contribute

## Deployment

## License

## Project Structure
