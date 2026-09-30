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

### Run the Service Using Docker

Set `JWT_SECRET` to a random value of at least 32 characters in your shell or the ignored `.env` file. Docker Compose passes it to the app container; the image does not contain your `.env` file. Then start Docker Desktop and run the API with a local MongoDB service:

```bash
docker compose up --build --wait
curl -i http://localhost:4000/health/ready
docker compose down
```

The readiness request should return HTTP 200 with `{"status":"ready"}`. If host port 4000 is busy, start with `APP_PORT=4001 docker compose up --build --wait` and check port 4001 instead.

Compose provides the API with `MONGODB_URI=mongodb://mongo:27017/prisma_hr`. Local MongoDB has no authentication and is not published on a host port; use sample data only. Its data persists in a named volume after `docker compose down`. Re-run `docker compose up --build --wait` after changing application code; this setup does not watch source files. When running the image without Compose, supply a MongoDB URI reachable from inside the container through the `MONGODB_URI` environment variable.

## Testing

### Local authentication

Set `JWT_SECRET` in the environment or `.env` to a random value of at least 32 characters. The server refuses to start without it. `POST /api/v1/auth/login` accepts an email and password and returns a one-hour Bearer token in `data.accessToken`. Send it as `Authorization: Bearer <token>` to routes that use the authentication middleware. Wrong passwords and unknown accounts return the same generic 401 response. The login route allows five requests per client IP per 15 minutes; its in-memory limit resets on restart and is not shared across server instances. Configure trusted proxies and a shared rate-limit store before running multiple instances behind a proxy.

To create the two local demo users and one demo employer, set `SEED_PROVIDER_EMAIL`, `SEED_PROVIDER_PASSWORD`, `SEED_EMPLOYER_EMAIL`, and `SEED_EMPLOYER_PASSWORD` in `.env`, then run `pnpm seed:dev`. The command may be run again without changing existing matching accounts. It fails if an existing account has a conflicting role or employer assignment. Never commit `.env` or use demo credentials in production.

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
