# Repository Guidelines

## Project Structure & Module Organization
sdiff is a TypeScript CLI compiled into ESM artifacts inside `dist/`. Entry points `src/index.ts` (batch diff) and `src/index-interactive.ts` (interactive TUI) render Ink components from `src/cli/`. Matching logic and replacements live in `src/diff/`, while `src/core/processor.ts` orchestrates normalization and diff attribution. Shared helpers reside in `src/utils/`. Markdown fixtures under `sample_*.md` plus `test-all-samples.sh` document real-world scenarios; keep new fixtures in the repo root for quick manual checks. Place unit tests next to code as `*.test.ts` so Jest picks them up via `roots: ['<rootDir>/src']`.

## Build, Test, and Development Commands
- `npm install` – install dependencies (Node 18+ recommended).
- `npm run dev original.md formatted.md` – run the TypeScript entry with ts-node for fast iteration.
- `npm run build` – emit ESM bundles into `dist/` (required before publishing or trying the global `sdiff` bin).
- `npm start sample_original.md sample_formatted.md` – execute the compiled CLI.
- `node dist/index-interactive.js sample_original.md sample_formatted.md` – launch the interactive reconciler.
- `npm test` and `./test-all-samples.sh` – run Jest suites plus regression scripts covering the supplied fixtures.
- `npm run lint` – enforce the TypeScript ESLint rules before pushing.

## Coding Style & Naming Conventions
Follow the existing two-space indentation and trailing-comma style enforced by ESLint (`@typescript-eslint`). Favor `camelCase` for functions/variables, `PascalCase` for React/Ink components, and hyphen-less file names mirroring their exported symbol (`algorithm.ts`, `InteractiveReplacer.tsx`). Prefer pure functions inside `src/diff/` and limit CLI-side side effects to component entry points. Re-export shared types to avoid deep relative imports.

## Testing Guidelines
Use Jest with `ts-jest` in ESM mode; create neighboring `*.test.ts` files (`src/diff/algorithm.test.ts` is the pattern). Tests should cover scenario permutations: perfect matches, punctuation-normalized matches, and edit-distance fallbacks. When touching Markdown parsing, extend `src/utils/markdown.test.ts` and add matching sample files plus an invocation line in `test-samples.md`. Keep branch coverage above 80% for diff algorithms and document any intentional gaps in the PR.

## Commit & Pull Request Guidelines
History uses short, imperative commit subjects (“Fix interactive mode keyboard input handling”). Keep commits scoped to a feature or bugfix, and mention touched subsystems when helpful (`diff:`, `cli:` optional prefixes). Pull requests should include: purpose summary, command outputs for `npm test`/`npm run lint`, notes on new sample files, and screenshots or transcripts when altering the interactive UI. Reference related issues and describe manual verification steps so downstream agents can replay them quickly.
