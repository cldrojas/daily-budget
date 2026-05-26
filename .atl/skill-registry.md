# Skill Registry — saldo-cero

Generated: Mon May 25 2026

## User Skills

### branch-pr
- **Path**: `~/.config/opencode/skills/branch-pr/SKILL.md`
- **Description**: PR creation workflow for Agent Teams Lite following the issue-first enforcement system.
- **Trigger**: When creating a pull request, opening a PR, or preparing changes for review.
- **Compact Rules**: Follow issue-first enforcement (create/link issue → branch → PR). Use `gh pr create` with structured body (Summary, Changes, Testing). Request review. Prefix branch with `GH-{issue-number}-`. Squash merge, delete branch.

### go-testing
- **Path**: `~/.config/opencode/skills/go-testing/SKILL.md`
- **Description**: Go testing patterns for Gentleman.Dots, including Bubbletea TUI testing.
- **Trigger**: When writing Go tests, using teatest, or adding test coverage.
- **Compact Rules**: Use `teatest` for TUI testing. Follow structured test patterns. Not currently applicable to this TS/Next.js project.

### issue-creation
- **Path**: `~/.config/opencode/skills/issue-creation/SKILL.md`
- **Description**: Issue creation workflow for Agent Teams Lite following the issue-first enforcement system.
- **Trigger**: When creating a GitHub issue, reporting a bug, or requesting a feature.
- **Compact Rules**: Use GitHub CLI (`gh`). Search for existing issues first. Use `gh issue create --label` with title/body. Body must include: Description, Steps to Reproduce (bugs), Expected vs Actual, Environment.

### judgment-day
- **Path**: `~/.config/opencode/skills/judgment-day/SKILL.md`
- **Description**: Parallel adversarial review protocol that launches two independent blind judge sub-agents.
- **Trigger**: When user says "judgment day", "judgment-day", "review adversarial", "dual review", "doble review", "juzgar", "que lo juzguen".
- **Compact Rules**: Launch two blind judge sub-agents in parallel. Synthesize findings. Apply fixes. Re-judge until both pass or escalate after 2 iterations.

### skill-creator
- **Path**: `~/.config/opencode/skills/skill-creator/SKILL.md`
- **Description**: Creates new AI agent skills following the Agent Skills spec.
- **Trigger**: When user asks to create a new skill, add agent instructions, or document patterns for AI.
- **Compact Rules**: Create SKILL.md with frontmatter (name, description, trigger). Include When to Use, Workflow steps, Examples. Register in skill registry.

### find-skills
- **Path**: `~/.agents/skills/find-skills/SKILL.md`
- **Description**: Helps users discover and install agent skills.
- **Trigger**: When user asks "how do I do X", "find a skill for X", "is there a skill that can...", or expresses interest in extending capabilities.
- **Compact Rules**: Search registry, suggest matching skills, provide install instructions.

### next-best-practices
- **Path**: `~/.agents/skills/next-best-practices/SKILL.md`
- **Description**: Next.js best practices — file conventions, RSC boundaries, data patterns, async APIs, metadata, error handling, route handlers, image/font optimization, bundling.
- **Trigger**: Auto-applied when writing or reviewing Next.js code (user-invocable: false).
- **Compact Rules**: Use App Router file conventions (page.tsx, layout.tsx, loading.tsx, error.tsx, not-found.tsx). Leverage RSC by default, use 'use client' only when needed. Use async components for data fetching. Prefer `next/navigation` for routing. Use `<Image>` for images. Use `next/font` for fonts. Apply metadata API for SEO. Handle errors with `error.tsx` boundaries.

## Project Conventions

### `.github/copilot-instructions.md`
Project-level agent instructions for the saldo-cero (daily-budget) project.

**Key patterns:**
- Next.js App Router frontend only (`app/`). No server-side backend; state is in-browser via `hooks/use-budget.tsx` and persisted to `localStorage`.
- UI componentized under `components/` with primitives in `components/ui/` (Radix + Tailwind).
- Global contexts: `contexts/language-context.tsx`, `contexts/currency-context.tsx`.
- Data flow: user actions → `useBudget()` hook mutates state → `localStorage` → UI re-renders.
- **Referenced files**: `hooks/use-budget.tsx`, `components/transaction-history.tsx`, `components/transactions-list.tsx`, `components/transaction-modal.tsx`, `types/index.ts`, `vitest.config.ts`, `playwright.config.ts`, `.github/workflows/tests.yml`, `README.md`.

**Conventions:**
- Translations: `useLanguage().t(key)` for translatable strings. Do NOT pass dynamic content to `t()`.
- Default accounts (`daily`, `savings`, `investment`) should not be deleted.
- Dates: `date-fns` with locale from language context.
- TypeScript-first: import types from `types/index.ts`.
- Persistence: `localStorage` key `daily-budget-data`; backward-compatible shapes.
- Commands: `pnpm dev`, `pnpm tsc --noEmit`, `pnpm test` (Vitest), `pnpm test:ui` (Playwright), `pnpm lint`.

## Stack Context
- **Frontend**: Next.js 16.2.6 (App Router), React 19, TypeScript 5
- **Styling**: Tailwind CSS 3.4, shadcn/ui (Radix UI primitives), Lucide icons
- **Testing**: Vitest (jsdom, @testing-library/react) + Playwright (chromium)
- **State Management**: React hooks + localStorage (no backend)
- **Package Manager**: pnpm 11
- **CI**: GitHub Actions (typecheck + unit tests on push/PR to main)
- **Linting**: ESLint 9 (next/core-web-vitals, next/typescript)
