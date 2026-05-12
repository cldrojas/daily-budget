# Skill Registry

**Delegator use only.** Any agent that launches sub-agents reads this registry to resolve compact rules, then injects them directly into sub-agent prompts. Sub-agents do NOT read this registry or individual SKILL.md files.

See `_shared/skill-resolver.md` for the full resolution protocol.

## User Skills

| Trigger | Skill | Path |
|---------|-------|------|
| When creating a pull request, opening a PR, or preparing changes for review | branch-pr | /Users/mac/.config/opencode/skills/branch-pr/SKILL.md |
| When creating a GitHub issue, reporting a bug, or requesting a feature | issue-creation | /Users/mac/.config/opencode/skills/issue-creation/SKILL.md |
| When writing Go tests, using teatest, or adding test coverage | go-testing | /Users/mac/.config/opencode/skills/go-testing/SKILL.md |
| When user says "judgment day", "judgment-day", "review adversarial", "dual review", "doble review", "juzgar", "que lo juzguen" | judgment-day | /Users/mac/.config/opencode/skills/judgment-day/SKILL.md |
| When user asks to create a new skill, add agent instructions, or document patterns for AI | skill-creator | /Users/mac/.config/opencode/skills/skill-creator/SKILL.md |
| When user is looking for functionality that might exist as an installable skill | find-skills | /Users/mac/.agents/skills/find-skills/SKILL.md |
| Next.js best practices - file conventions, RSC boundaries, data patterns, async APIs, metadata, error handling, route handlers, image/font optimization, bundling | next-best-practices | /Users/mac/.agents/skills/next-best-practices/SKILL.md |

## Compact Rules

Pre-digested rules per skill. Delegators copy matching blocks into sub-agent prompts as `## Project Standards (auto-resolved)`.

### branch-pr
- Every PR MUST link an approved issue — no exceptions
- Every PR MUST have exactly one `type:*` label
- Automated checks must pass before merge is possible
- Branch naming: `type/description` (lowercase, no spaces)
- Types: feat, fix, chore, docs, style, refactor, perf, test, build, ci, revert
- Conventional commits: `type(scope): description` or `type: description`

### issue-creation
- Blank issues disabled — MUST use template (bug report or feature request)
- Every issue gets `status:needs-review` automatically on creation
- Maintainer MUST add `status:approved` before PR can be opened
- Questions go to Discussions, not issues

### next-best-practices
- No useMemo/useCallback — React Compiler handles memoization
- use() hook for promises/context, replaces useEffect for data fetching
- Server Components by default, add 'use client' only for interactivity/hooks
- ref is a regular prop — no forwardRef needed
- Actions: use useActionState for form mutations, useOptimistic for optimistic UI
- Metadata: export metadata object from page/layout, no <Head> component

### judgment-day
- Launch TWO independent blind judges in parallel via delegate (async)
- Judges receive identical criteria but work independently
- Verdict synthesis: Confirmed (both agree), Suspect (one only), Contradiction (disagree)
- Max 2 fix iterations, then escalate to user
- Never review code as orchestrator — only coordinate

### go-testing
- Use table-driven tests for multiple test cases
- Test Model.Update() for TUI state transitions
- Use teatest.NewTestModel() for full TUI integration tests
- Golden file testing for visual output comparison

## Project Conventions

| File | Path | Notes |
|------|------|-------|
| Copilot instructions | /Users/mac/dev/saldo-cero/.github/copilot-instructions.md | Index — references files below |

Read the convention files listed above for project-specific patterns and rules. All referenced paths have been extracted — no need to read index files to discover more.