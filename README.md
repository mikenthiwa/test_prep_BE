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
- [Errors](#errors)
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

Set `MONGODB_URI` in the environment before starting the server, or put it in `.env` using `.env.example` as a guide. The development and production scripts load `.env` when it exists; an existing environment variable takes precedence. Startup waits for MongoDB to connect before accepting HTTP requests; a failed connection prevents startup.

Startup logs a safe failure reason without printing the URI or credentials: `missing_uri` (set `MONGODB_URI`), `invalid_uri` (check its format), `authentication_failed` (check credentials and `authSource`), `server_unavailable` (check MongoDB and network access), or `connection_failed` (another connection error). One connection attempt is made; Mongoose's default server-selection timeout applies.

`GET /health/ready` reports whether Mongoose is connected: it returns `200` with `{ "status": "ready" }` when connected, or `503` Problem Details when disconnected. The endpoint is unversioned and never cached. The HTTP process stays running during a later MongoDB outage while Mongoose reconnects; readiness returns to `200` after reconnection.

## Testing

Run the test suite once with `pnpm test`, or keep it running during development with `pnpm test:watch`.
Use `pnpm typecheck:test` to type-check test files and `pnpm exec tsc --noEmit` to type-check application code.
HTTP tests use Supertest, while database tests use an isolated `mongodb-memory-server` instance.
The first database test run may download a MongoDB binary; no local MongoDB service is needed for tests.

## Logging

The server writes one JSON log line when it starts and one when each HTTP request completes. `pnpm start:dev` formats those lines with `pino-pretty` for local reading; production output stays JSON. Request logs include the method, path, status code, response time in milliseconds, and a generated request ID. The same ID is returned in the `X-Request-Id` response header. Incoming request IDs are not reused.

Logs omit request and response bodies, headers, and URL query values. HTTP responses below 400 log at `info`, 4xx responses at `warn`, and 5xx responses at `error`.

## Errors

API errors use `application/problem+json`. The response body contains `type`, `title`, `status`, the request path as `instance`, and `requestId` matching the `X-Request-Id` response header and request log. Query values are excluded from `instance`. `detail` is included only when it is safe to show clients. Generic errors use `type: "about:blank"`; the body status matches the HTTP status. For example, an unknown route returns:

```json
{
  "type": "about:blank",
  "title": "Not Found",
  "status": 404,
  "detail": "The requested resource /missing was not found.",
  "instance": "/missing",
  "requestId": "3a4bbf71-63f0-42ae-a11c-7254ca35a52d"
}
```

Malformed JSON returns 400, and oversized JSON returns 413. Unexpected failures return a generic 500 without internal details; the server logs the exception with the request ID from `X-Request-Id`.

## Contribute

## Deployment

## License

## Project Structure
