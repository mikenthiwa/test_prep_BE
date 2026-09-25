# Project Guidelines

## Setup

- Use pnpm 10.32.1, as declared in package.json.
- Install dependencies with `pnpm install --frozen-lockfile`.
- Start development with `pnpm start:dev` (tsx watch).
- Compile TypeScript with `pnpm build`.
- `pnpm start:prod` runs `node dist/index.js`.
- The server reads PORT from the environment and defaults to 3000.

## Testing

- `pnpm test` is a placeholder that exits with an error; no test runner is configured.
- Run `pnpm exec tsc --noEmit` for type checking without generated files.
- Run `pnpm build` when validating compilation.
- For meaningful behavior changes, define acceptance requirements and add tests first.
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
