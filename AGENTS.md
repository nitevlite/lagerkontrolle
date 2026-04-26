# Repository Guidelines

## Project Structure & Module Organization

Keep the repository predictable and local-first. Application code lives in `src/`, PWA static assets in `public/`, shared documentation in `docs/`, and GitHub-specific templates in `.github/`. Keep root-level files limited to project entry docs and configuration such as `README.md`, `PLAN.md`, `QUESTIONS.md`, `package.json`, and `vite.config.ts`.

Example layout:

```text
src/
public/
docs/
.github/
```

## Build, Test, and Development Commands

Expose common tasks through `npm` scripts so contributors do not need to guess.

Examples:

```sh
npm install
npm run dev
npm run build
```

`npm run dev` starts the Vite PWA locally. `npm run build` runs the TypeScript check and production build. Document every new command in `README.md`.

## Coding Style & Naming Conventions

Use consistent formatting from the start. Prefer 2 spaces for frontend configs and 4 spaces for Python if Python is introduced. Use descriptive names: `inventory_service.py`, `stock-table.tsx`, `test_inventory_api.py`. Keep filenames lowercase with hyphens or underscores based on language norms, and match directory names to domain concepts rather than technical layers where possible.

Adopt an automatic formatter and linter with the first language-specific setup, such as `prettier` and `eslint` for JavaScript or `ruff` for Python.

## Testing Guidelines

Place tests under `tests/` and mirror the source structure once the test setup is added. Name test files after the unit under test, for example `tests/inventory/item-movement.test.ts` or `tests/locations/location-editor.test.tsx`. Add regression tests for every bug fix. Treat changed code as requiring tests before merge.

## Commit & Pull Request Guidelines

There is no existing git history in this workspace, so use clear imperative commit messages from the beginning, such as `Add stock adjustment service` or `Fix item search filter`. Keep commits focused on one change.

Pull requests should include a short summary, testing notes, linked issue if available, and screenshots for UI changes. Do not mix refactors, feature work, and unrelated formatting in the same PR.

## Documentation Maintenance

All Markdown documentation must stay current with the code and product decisions. This includes `README.md`, `PLAN.md`, `QUESTIONS.md`, everything under `docs/`, and `.github/pull_request_template.md`. When Codex changes scope, architecture, workflows, setup, backlog status, or GitHub ticket planning, it must update the affected Markdown files in the same work stream.

## Configuration Notes

Do not commit secrets, local database files, or environment-specific exports. Add `.env.example` when configuration is introduced and document required variables in `README.md`.
