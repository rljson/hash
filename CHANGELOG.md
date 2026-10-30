# Changelog

## [Unreleased]

### CLAUDE.md keeps this repo's own rules

- The rules every rljson repo shares (coverage, pinning, docs, releases,
  reviews) come with the rljson DNA: `doc/guides/rljson-guide.md` and
  `doc/guides/for-ai/rljson-review-guide.md`. `CLAUDE.md` no longer repeats
  them and no longer describes the old `gg one` workflow.

## [0.0.20]

### Developed in gg tickets

- **Developed in gg tickets.** The repo carries the rljson DNA (`@rljson/dna-rljson`): gg's `/gg-*` skills, the guides and the quick check (`.github/workflows/quick_check.yaml`).
- **Pull requests are checked by the quick check** (`gg one did commit`: every commit went through gg's local lint, tests and coverage). `Build and Test` runs on `main` after the merge.
- **vitest also runs `test/**/*.test.ts`,** where gg's release writes the version test.
- **`minimumReleaseAgeExclude: ['@rljson/*']`:** pnpm 11 holds back packages younger than a day, and a release of the chain installs versions published minutes earlier.
- **Dependencies raised to their newest versions** (TypeScript 6 among them).

## [0.0.17]

- BREAKING CHANGES:
  - Changed hash calculation for floating point numbers
  - IMPORTANT: JSON WITH FLOATING POINT NUMBERS WILL CREATE DIFFERENT HASHES

## [0.0.13]

- BREAKING CHANGES:
  - `applyInPlace` and `hip` take ApplyConfigs now
  - `applyInPlace`, `hip`, `apply`, `hsh` return the original objects
  - They do not the `Hashed` version

## [0.0.2]

Initial commit.
