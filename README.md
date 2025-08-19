# Saldo Cero

## Purpose

Saldo Cero is a minimalist finance app designed to eliminate the anxiety of money management. It provides users with a clear, daily spending allowance, removing the need for complex charts or accounting knowledge. The app’s goal is to offer financial peace of mind by showing exactly how much you can spend today—no guilt, no calculations.

---

## Folder Structure

```
/app            # Next.js app directory (pages, layouts, global styles)
|-- globals.css
|-- layout.tsx
|-- page.tsx

/components     # UI and feature components
|-- DailyBudgetApp.tsx
|-- ... (other components)
/components/ui  # UI primitives (buttons, dialogs, etc.)

/contexts       # React context providers (currency, language)
/hooks          # Custom React hooks
/lib            # Utility functions
/public         # Static assets (icons, images)
/src            # (Optional) Additional source code
/styles         # Global styles
/types          # TypeScript type definitions
```

---

## Technologies

- **Frontend:** Next.js (React), Tailwind CSS, Radix UI, TypeScript
- **State Management:** React Context, Custom Hooks
- **Styling:** Tailwind CSS, PostCSS
- **Icons & UI:** Lucide, Radix UI Primitives
- **Testing:** (Cypress planned, not yet present)
- **Backend:** (Pluggable, see architecture)
- **Database:** (Pluggable, see architecture)
- **Infrastructure:** Cloudflare Workers, Cloudflare D1 (planned)

---

## Architecture

- **Frontend:** Built with Next.js using the App Router and React Server Components for optimal performance and scalability.
- **Componentization:** Modular UI components and hooks for maintainability and reusability.
- **State:** Managed via React Context and custom hooks for budget, language, and currency.
- **Backend:** Designed to be serverless-first (Cloudflare Workers), but can be adapted to any REST/GraphQL backend.
- **Database:** Cloudflare D1 (SQLite-compatible, serverless), with the option to swap for PostgreSQL or other DBs.
- **Security:** No user data is sold or shared; privacy is a core value.

---

## Setup Instructions

### Prerequisites

- Node.js (v18+ recommended)
- pnpm (or npm/yarn)
- Docker (for PostgreSQL, if backend is required)
- (Planned) Cypress for E2E testing

### 1. Clone the Repository

```sh
git clone https://github.com/cldrojas/daily-budget.git
cd daily-budget
```

### 2. Install Dependencies

```sh
pnpm install
# or
npm install
```

### 3. Run the Frontend

```sh
pnpm dev
# or
npm run dev
```

### 4. (Optional) Setup PostgreSQL with Docker

If you want to use PostgreSQL locally:

```sh
docker run --name saldo-cero-db -e POSTGRES_PASSWORD=yourpassword -p 5432:5432 -d postgres
```

Update your environment variables as needed.

### 5. (Planned) Run Cypress Tests

```sh
# Install Cypress if not present
pnpm add -D cypress
# Open Cypress test runner
pnpm cypress open
```

---

## Notes

- The current implementation is frontend-focused. Backend and database integration are designed to be pluggable and serverless-friendly.
- For production, consider deploying on Vercel, Cloudflare, or similar platforms.

---
