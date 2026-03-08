# Versioning Guide

## Strategy
- Semantic Versioning: `MAJOR.MINOR.PATCH`
- Conventional Commits for commit messages
- Git tags per release: `vX.Y.Z`

## Branch model
- `main`: production-ready code
- `develop`: integration branch
- `feature/*`: new features
- `hotfix/*`: urgent production fixes

## Conventional commits
- `feat:` new functionality
- `fix:` bug fix
- `refactor:` internal code improvement
- `docs:` documentation updates
- `chore:` maintenance tasks
- `ci:` CI/CD changes
- `build:` build/toolchain changes

Examples:
- `feat(dashboard): add global alerts from supabase`
- `fix(layout): prevent header/sidebar overlap on desktop`
- `chore(release): v0.2.1`

## Release flow
1. Merge approved work to `main`.
2. Run one command:
   - Patch: `npm run release:patch`
   - Minor: `npm run release:minor`
   - Major: `npm run release:major`
3. Push commit and tag:
   - `git push`
   - `git push --tags`

The release script will:
- run build
- bump version in `package.json` and `package-lock.json`
- update `CHANGELOG.md`
- commit `chore(release): vX.Y.Z`
- create git tag `vX.Y.Z`

## Notes for Supabase schema changes
- Store SQL migrations in `supabase/migrations/`.
- Keep app release and DB migration in the same PR when they depend on each other.
- Never patch production schema manually without migration tracking.
