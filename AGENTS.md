# Project Guidelines

## Setup

- Use pnpm 10.32.1, as declared in package.json.
- Install dependencies with `pnpm install --frozen-lockfile`.
- Start development with `pnpm start:dev` (Node watch with tsx).
- Compile TypeScript with `pnpm build`.
- `pnpm start:prod` runs `node --env-file-if-exists=.env dist/index.js`.
- The start scripts load `.env` when present; keep credentials out of logs and commits.
- The server reads PORT from the environment and defaults to 4000.

## Testing

- Run the suite once with `pnpm test` or watch changes with `pnpm test:watch`.
- Run `pnpm typecheck:test` to type-check tests.
- Run `pnpm exec tsc --noEmit` for type checking without generated files.
- Run `pnpm build` when validating compilation.
- For new features and meaningful behavior changes, write a test for the expected behavior, confirm it fails, implement the smallest change that passes it, then refactor.
- Test observable behavior through the boundary callers use, such as HTTP responses, persisted records, or emitted logs, instead of internal implementation steps.
- Avoid repeating the same behavior in helper and higher-level tests. Keep direct tests for distinct rules that are impractical to exercise through the caller boundary, and add cases when a feature introduces the behavior rather than speculating about future use.
- Report checks performed, failures, and checks skipped with reasons.

## Style

- Use TypeScript with ES module imports and explicit type-only imports.
- Preserve strict compiler settings and existing code conventions.
- Match existing four-space indentation, single quotes, and semicolons.
- Keep functions small, names clear, and changes focused.
- No formatter or linter is currently configured.

## Review

- Show a diff before applying large or multi-file changes.
- Check for regressions, missing tests, unnecessary complexity, and convention drift.
- State material assumptions, risks, and follow-up work; never commit .env secrets.
