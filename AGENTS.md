# Repository Agent Rules

These instructions apply to the whole `EasyAgent` frontend repository.

## Git commits and linting

- Never run `pnpm lint` in this repository. The script executes `eslint . --fix` and rewrites files.
- Never run ESLint, Prettier, or another formatter with `--fix`, `--write`, or an equivalent mutating option as part of a commit.
- The configured pre-commit hook runs `pnpm lint`, so do not let it execute. Run the required non-mutating checks explicitly, then commit with `git commit --no-verify`.
- Use `pnpm typecheck` for the standard frontend check. When lint validation is needed, run `pnpm exec eslint <changed-files>` without `--fix` and inspect the result.
- Before and after committing, inspect `git status` and the staged diff. Stage only files and hunks that belong to the current task, and preserve all unrelated worktree changes.
