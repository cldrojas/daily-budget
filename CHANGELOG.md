# Changelog

All notable changes to the **Daily Budget** project will be documented in this file.

## [Unreleased]

### Features
- Add new feature descriptions here
- `lib/cashflow.ts`: daily balance calculation utility (`calculateDailyBalance`) with `DailyMovement`, `CashflowDayInput`, and `CashflowDayResult` interfaces
- Autenticación con Supabase (issue #40, change `supabase-auth-backend`): sesión con `@supabase/ssr` (cookies httpOnly + refresh en `proxy.ts`), clientes `lib/supabase/client.ts` y `server.ts`, `AuthProvider` global, página `/login` con tabs login/registro (react-hook-form + zod), sign out en menú de usuario del header
- Schema remoto en proyecto Supabase dedicado (`whacwpjgizlxvnmckyli`): `profiles`, `accounts`, `transactions` + triggers (`handle_new_user`, `set_updated_at`) + RLS own-rows
- Verificación de aislamiento RLS (`supabase/tests/rls_isolation.sql`)

### Bug Fixes
- Fix bug descriptions here

### Improvements
- Improvement descriptions here
- `middleware.ts` renombrado a `proxy.ts` (Next 16.2 deprecó la convención `middleware`)

### Breaking Changes
- La app ahora requiere sesión: `/` redirige a `/login` sin autenticación (localStorage de la app no se ve afectado; `use-budget.tsx` sin cambios)

## [1.0.0] - 2024-01-01

### Features
- Initial release of Daily Budget application
- Next.js App Router frontend with TypeScript
- Budget management with accounts and transactions
- Local storage persistence
- Multi-language support (English/Spanish)
- Currency formatting
- Responsive UI with Tailwind CSS and Radix UI components

### Technical Details
- Built with Next.js 15+ and React 19
- TypeScript for type safety
- Comprehensive test suite (Vitest + Playwright)
- GitHub Actions CI/CD pipeline
- pnpm for package management

---

## Format Guidelines

When documenting changes, please follow this format:

### Features
- **Feature Name**: Brief description of the new feature
  - Technical details or implementation notes
  - Related issue/PR links if applicable

### Bug Fixes
- **Issue**: Description of what was fixed
  - Root cause explanation
  - Testing approach

### Improvements
- **Enhancement**: Description of the improvement
  - Performance impact
  - User experience benefits

### Breaking Changes
- **Change**: Description of breaking change
  - Migration guide
  - Alternative approaches

## Contributing

When submitting a pull request, please update this changelog with your changes:

1. Add your changes to the **[Unreleased]** section
2. Use the appropriate category (Features, Bug Fixes, Improvements, Breaking Changes)
3. Include a brief but descriptive title
4. Add technical details and context when relevant
5. Link to related issues or PRs

## Versioning

This project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html):

- **Major** version for breaking changes
- **Minor** version for new features
- **Patch** version for bug fixes