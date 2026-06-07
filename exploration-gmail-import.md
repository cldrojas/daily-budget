# Exploration: Gmail Transaction Import Pipeline

## Executive Summary

This document is a thorough analysis of the Saldo Cero codebase and Gmail API integration patterns, produced to feed the PRD for a Gmail-based transaction import feature. The app currently stores everything in localStorage with no backend. Adding Gmail import will require: (1) a backend/API layer for OAuth + Gmail API calls, (2) an email parsing engine, (3) a review/approval UI, and (4) data persistence changes.

---

## 1. Current Codebase Analysis

### Project Structure
```
saldo-cero/
├── app/                          # Next.js 16 App Router
│   ├── layout.tsx                # Root layout: ThemeProvider → LanguageProvider → CurrencyProvider
│   ├── page.tsx                  # Main SPA page (client component)
│   └── not-found.tsx
├── components/
│   ├── ui/                       # Radix UI primitives (button, dialog, select, tabs, etc.)
│   ├── modals/
│   │   ├── transaction-modal.tsx  # Add/edit transaction form
│   │   ├── delete-transaction-modal.tsx  # Delete with refund option
│   │   ├── transfer-modal.tsx     # Transfer between accounts
│   │   ├── account-modal.tsx      # Account creation
│   │   ├── account-edit-modal.tsx # Account edit
│   │   └── confirm-dialog.tsx     # Generic confirmation dialog
│   ├── navbar.tsx                 # Main navigation with tabs + FAB
│   ├── accounts-list.tsx          # Account cards grid
│   ├── transactions-list.tsx      # Recent expenses list
│   ├── transaction-history.tsx    # Full table view with delete
│   ├── daily-budget-status.tsx    # Circular progress + budget info
│   ├── config-form.tsx            # Budget settings collapsible
│   ├── setup-form.tsx             # Initial budget setup
│   └── error-boundary.tsx         # Error boundary + helpers
├── hooks/
│   ├── use-budget.tsx             # SINGLE SOURCE OF TRUTH for all state
│   ├── use-toast.ts
│   └── use-mobile.tsx
├── contexts/
│   ├── language-context.tsx       # i18n (en/es) with t() function
│   └── currency-context.tsx       # Currency formatting (CLP, USD, MXN, etc.)
├── types/
│   └── index.ts                   # Transaction, Account, Budget, Int (branded)
├── lib/
│   └── utils.ts                   # cn() helper
├── styles/
│   └── globals.css                # Tailwind + CSS variables
├── tests/
│   ├── unit/                      # Vitest tests (use-budget, modals, etc.)
│   └── ui/                        # Playwright E2E tests
├── package.json                   # Next 16.2, React 19, Radix UI, etc.
└── vitest.config.ts
```

### Current Data Model

**types/index.ts:**
```typescript
type TransactionType = 'expense' | 'transfer' | 'income' | 'adjustment'

type Transaction = {
  id: string              // uuid
  type: TransactionType
  amount: Int             // branded integer type, negative for expenses
  description: string
  account: string         // account.id (foreign key by convention)
  date: Date
}

type Account = {
  id: string
  name: string
  type: string            // 'daily' | 'savings' | 'investment' | 'expense'
  balance: Int
  icon: string
}

type Budget = {
  startAmount: Int
  startDate: Date | undefined
  endDate: Date | undefined
  autoSave: boolean
  mode?: 'daily' | 'track'
}
```

### State Management Pattern

- **useBudget()** in `hooks/use-budget.tsx` is the single source of truth
- It holds `accounts`, `transactions`, `budget` + derived state (`dailyAllowance`, `remainingToday`, `progress`)
- All mutations happen through the hook: `addTransaction()`, `removeTransaction()`, `updateTransaction()`
- Data is persisted to localStorage under key `daily-budget-data`
- There is NO backend, NO database, NO API layer whatsoever
- Components import `useBudget()` directly via the hook (no Context for budget state)
- **Important:** Adding Gmail import means either extending `useBudget()` significantly or introducing a new data layer

### Transaction Display Patterns

1. **TransactionModal** — Reusable add/edit form with fields: amount, description, account (Select), date (DatePicker), type (Tabs: expense/income). Uses `onAddTransaction` and `onUpdateTransaction` callbacks.

2. **TransactionHistory** — Table view showing all transactions with delete capability. Uses `DeleteTransactionModal` for confirmation with refund/keep-balance options.

3. **TransactionList** — Card list showing recent expenses only. Shows description, date, account name, and amount.

4. **Navbar** — Three tabs (Accounts, Transfer, History) + floating action button for adding transactions.

### Current Limitations for Import Feature

- No concept of "pending" or "unreviewed" transactions
- No transaction source tracking (manual vs imported)
- No deduplication mechanism
- No API routes exist (`app/api/` directory doesn't exist)
- No environment variables or .env files
- No authentication system (single user, local-only)

---

## 2. Gmail API Integration Strategy

### Architecture Decision: Backend Required

Since Gmail API requires OAuth 2.0 client secrets that **must not** be exposed client-side, this feature needs a server-side component. Options:

| Approach | Pros | Cons | Recommendation |
|----------|------|------|---------------|
| **Next.js API Routes** | Already in project stack, serverless, same codebase | New to this project, needs env setup | ✅ **Recommended** for v1 |
| **Cloudflare Workers** | Planned backend, edge-deployed | Not set up yet, adds infra complexity | ⏳ Future |
| **Third-party (Nylas, etc.)** | Handles OAuth + rate limits | Adds cost, external dependency | ❌ Overkill |

### OAuth 2.0 Flow

```
1. User clicks "Connect Gmail" button
2. Redirect to Google OAuth consent screen
3. User authorizes → Google redirects to /api/auth/gmail/callback
4. Server exchanges code for access_token + refresh_token
5. Store refresh_token securely (encrypted in DB or httpOnly cookie)
6. Use refresh_token to get access_token for API calls
7. Access token expires → auto-refresh via googleapis library
```

### Required Google Cloud Setup

1. **Create project** in Google Cloud Console
2. **Enable Gmail API**
3. **Configure OAuth consent screen** — need to submit for verification if app is public (sensitive scope)
4. **Create OAuth 2.0 credentials** (Web application type)
5. **Authorized redirect URIs**: `https://yourdomain.com/api/auth/gmail/callback`, `http://localhost:3000/api/auth/gmail/callback`

### OAuth Scopes

| Scope | Access | Verification Required |
|-------|--------|----------------------|
| `gmail.readonly` | View emails + metadata | ✅ Restricted scope |
| `gmail.metadata` | Only headers/labels, NO body | ❌ Not enough for parsing |
| `gmail.modify` | Read, compose, send | Overkill for import only |

**Recommendation:** `https://www.googleapis.com/auth/gmail.readonly`

This gives us access to read email bodies (needed for parsing transaction details) but NOT to send or delete emails.

### Gmail API Endpoints Needed

1. **`users.messages.list`** (5 quota units)
   - Search via `q` parameter: `from:bank@example.com after:2024/1/1`
   - Returns message IDs + thread IDs
   - Pagination via `nextPageToken`
   - Max 500 per page, default 100

2. **`users.messages.get`** (20 quota units as of May 2026)
   - Format: `full` (gets payload with body) or `metadata` (just headers)
   - For parsing: need `format=full` to get email body
   - Can use `format=metadata` with specific `metadataHeaders` to screen first

3. **`users.history.list`** (2 quota units)
   - For incremental sync after initial import
   - Get only new messages since last check

### Gmail Query Syntax (q parameter)

```
from:notificaciones@banco.com after:2024/1/1
from:(banco OR bank) subject:(compra OR transferencia OR pago)
from:alertas@banco.com subject:"Tarjeta" after:2024/06/01
```

The user can configure which email senders to scan.

### Quota Planning (May 2026 Limits)

| Limit | Value | Impact |
|-------|-------|--------|
| Per min per project | 1,200,000 units | Fine for personal use |
| Per min per user per project | 6,000 units | ~300 `messages.get`/min |
| Daily threshold | 80,000,000 units | Before billing |

**Initial import cost estimate:**
- 50 inbox emails matching bank filter → 1 list call (5) + 50 get calls (20 each) = **1,005 units**
- Realistic: 6 months of emails, ~200 matches = **~4,005 units**
- Daily watch sync: maybe 5-10 emails → **~205 units/day**

Conclusion: well within free quotas for personal use.

### Push Notifications (Optional)

Can use `users.watch` with Cloud Pub/Sub to get real-time notifications when new bank emails arrive. This replaces polling. Adds complexity (Google Cloud Pub/Sub setup) but enables near-real-time import.

---

## 3. Email Parsing Approach

### The Challenge

Bank emails have NO standardized format. Each bank uses different templates, and they can change without notice. Formats include:

```
"Mercado Pago: Compra en NETFLIX por $1,500.00"
"BancoEstado: Transferencia recibida de Juan Perez por $5,000.00"
"STP: Pago de servicio NETFLIX por $299.00"
"Tarjeta 1234: Cargo de $899 en MERCADOPAGO"
```

### Approach Comparison

| Approach | Pros | Cons | Best For |
|----------|------|------|----------|
| **Regex only** | Fast, no dependencies, works offline | Fragile, breaks on format changes, needs maintenance | Known senders with stable format |
| **Template-based** | Works per-bank, predictable | Must build/maintain one parser per bank | 2-5 common banks |
| **LLM/AI parsing** | Resilient to format changes | Latency, cost, needs API key, overkill for v1 | Fallback for unknown formats |
| **Hybrid (Recommended)** | Best of both worlds, graceful fallback | More complex code | **✅ All scenarios** |

### Recommended: Hybrid Strategy (v1)

**Layer 1 — Template Matchers (per sender):**
Maintain a registry of known email senders with regex patterns:

```typescript
// lib/import/parsers/registry.ts
type EmailParser = {
  sender: string              // from address
  bankName: string            // display name
  patterns: RegExp[]
  parse: (body: string) => ParsedTransaction | null
}

// Example for a known bank
const mercadopagoParser: EmailParser = {
  sender: 'no-reply@mercadopago.com',
  bankName: 'Mercado Pago',
  patterns: [
    /Compra en\s+(.+?)\s+por\s+\$?([\d,.]+)/i,
    /Pago\s+(?:de|a)\s+(.+?)\s+por\s+\$?([\d,.]+)/i,
  ],
  parse(body) { /* extract amount, entity, date from body */ }
}
```

**Layer 2 — Generic Fallback:**
For unrecognized senders, use a more general extraction approach:

```typescript
// Generic extraction using heuristics
const amountPattern = /\$[\s]*([0-9]+(?:[.,][0-9]{2})?)/g
const datePattern = /\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/g
const entityPattern = /(?:en|a|de|por)\s+([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-zéíóúañ\s]{3,30})/g
```

**Layer 3 — LLM Enhancement (v2):**
If regex fails or `parseResult.confidence < threshold`, pass to an LLM with structured output for parsing. This requires an AI SDK integration but dramatically improves coverage.

### Parsing Output Contract

```typescript
type ParsedTransaction = {
  gmail_message_id: string
  amount: string              // raw amount string: "$1,500.00" or "1500"
  amountCents: number         // normalized: 150000 (cents)
  entity: string              // merchant/person name: "NETFLIX", "Juan Perez"
  date: Date                  // transaction date (from email, not email received date)
  type: 'expense' | 'income' // inferred from context
  confidence: number          // 0-1 score
  rawSubject: string
  rawSnippet: string
  rawBody: string
  sender: string              // from address
}
```

### Amount Normalization

Critical for Chilean/LATAM currencies:
- "1.500" → 1500 (Chilean format: dot is thousands separator)
- "1,500.00" → 150000 cents (US format)
- "1,500" → 150000 cents (mixed format)

Strategy: detect locale from currency context (`CLP` → Chilean format, `USD` → US format), then parse accordingly.

### Entity Extraction Heuristics

Remove common stopwords/prefixes from entity names:
- "Compra en MERCADOPAGO" → "MERCADOPAGO"
- "Pago de servicio NETFLIX" → "NETFLIX"
- "Transferencia de Juan Perez" → "Juan Perez"
- "Cargo en AMAZON PRIME" → "AMAZON PRIME"

---

## 4. Proposed Schema

### New Types (types/index.ts additions)

```typescript
// types/index.ts additions

export type ImportedTransaction = {
  id: string                      // uuid
  gmailMessageId: string          // UNIQUE from Gmail API
  threadId: string                // Gmail thread ID for grouping
  sender: string                  // from address
  bankName: string                // resolved bank name
  
  // Parsed data
  parsedAmount: number | null     // in cents (Int)
  parsedEntity: string | null     // merchant/person
  parsedDate: string | null       // ISO date string (email's transaction date)
  parsedType: TransactionType | null  // 'expense' | 'income'
  confidence: number              // 0-1 parsing confidence
  
  // Raw email data
  rawSubject: string
  rawSnippet: string
  rawBody: string                 // plain text body
  
  // Review status
  status: ImportStatus
  reviewedAt: string | null       // ISO date
  reviewedBy: string | null       // user id (future)
  
  // Link to created transaction (after approval)
  transactionId: string | null    // FK to Transaction.id
  
  // Metadata
  createdAt: string               // ISO date
  updatedAt: string               // ISO date
}

export type ImportStatus = 'pending' | 'approved' | 'rejected' | 'draft'

export type GmailAccount = {
  email: string
  accessToken: string             // encrypted
  refreshToken: string            // encrypted
  gmailHistoryId: string | null   // for incremental sync
  lastSyncedAt: string | null
  createdAt: string
}
```

### SQL Schema (for future D1/SQLite)

```sql
-- email_transactions table
CREATE TABLE email_transactions (
  id TEXT PRIMARY KEY,
  gmail_message_id TEXT UNIQUE NOT NULL,
  thread_id TEXT,
  sender TEXT NOT NULL,
  bank_name TEXT,
  
  -- Parsed data
  parsed_amount INTEGER,           -- in cents
  parsed_entity TEXT,
  parsed_date TEXT,                -- ISO 8601
  parsed_type TEXT CHECK(parsed_type IN ('expense', 'income')),
  confidence REAL DEFAULT 0.0,
  
  -- Raw email data
  raw_subject TEXT NOT NULL,
  raw_snippet TEXT,
  raw_body TEXT,
  
  -- Review
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'draft')),
  reviewed_at TEXT,
  
  -- Link to existing transaction model
  transaction_id TEXT,
  
  -- Metadata
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  
  FOREIGN KEY (transaction_id) REFERENCES transactions(id)
);

-- gmail_accounts table (for multi-account support)
CREATE TABLE gmail_accounts (
  email TEXT PRIMARY KEY,
  access_token TEXT NOT NULL,       -- encrypted
  refresh_token TEXT NOT NULL,      -- encrypted
  token_expires_at TEXT,
  gmail_history_id TEXT,
  last_synced_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_email_transactions_status ON email_transactions(status);
CREATE INDEX idx_email_transactions_sender ON email_transactions(sender);
CREATE INDEX idx_email_transactions_created ON email_transactions(created_at);
CREATE UNIQUE INDEX idx_email_transactions_gmid ON email_transactions(gmail_message_id);
```

### Relationship to Existing Model

```
Transaction (today)                ImportedTransaction (new)
├── id (uuid)                      ├── id (uuid)
├── type ('expense'/'income')      ├── gmail_message_id (UNIQUE)
├── amount (Int, cents)            ├── parsed_amount (cents, nullable)
├── description (string)           ├── parsed_entity (merchant name)
├── account (FK → Account.id)      ├── parsed_date (transaction date)
├── date (Date)                    ├── parsed_type (expense/income/null)
                                   ├── status (pending/approved/rejected)
                                   ├── transaction_id → Transaction.id (nullable)
                                   ├── confidence (0-1)
                                   ├── raw_subject, raw_snippet, raw_body
                                   └── sender, bank_name
```

When user **approves** → creates Transaction from ImportedTransaction data.
When user **rejects** → marks status='rejected', logs `reviewedAt`.

---

## 5. Deduplication Strategy

### Primary Mechanism: `gmail_message_id UNIQUE`

Each Gmail message has a globally unique, immutable `id`. This is the deduplication key.

### Flow

```
1. Batch fetch messages from Gmail (messages.list)
2. For each message ID:
   a. Check: SELECT id FROM email_transactions WHERE gmail_message_id = ?
   b. If exists → SKIP (already imported)
   c. If not exists → fetch full message (messages.get) → parse → INSERT
3. Alternative: Batch-check all IDs first to minimize DB queries
```

### Protection Layers

| Layer | Mechanism | Prevents |
|-------|-----------|----------|
| **DB constraint** | `UNIQUE` on `gmail_message_id` | Duplicate inserts even with race conditions |
| **App-level check** | SELECT before INSERT | Unnecessary API calls for already-imported messages |
| **Gmail query filter** | Use `q` parameter to narrow search | Fetching irrelevant messages |
| **History-based sync** | Track `gmailHistoryId`, use `history.list` | Re-processing already-seen messages |

### Edge Cases

- **Same transaction notified twice** (bank sends both email + SMS → Gmail): still has different message IDs, so both appear as separate candidates. User must manually reject one.
- **Threaded replies**: Gmail groups replies in threads. Each message in thread has unique ID. Should import individually.
- **Re-import after account reconnect**: `gmail_message_id` dedup prevents duplicates. If user deletes all `email_transactions` and re-imports, previous IDs would be gone → new imports happen.

---

## 6. Review & Approval UX Flow

### Phase 1: Gmail Connection

```
[Navbar] → New "Import" tab (or button in settings)
  → "Connect Gmail" button
  → Google OAuth popup/redirect
  → After auth: "Select senders to import from"
    → Checkboxes: [x] BancoEstado, [ ] Mercado Pago, [ ] STP
    → Or: "Search for bank emails" auto-discovers senders
  → "Import Now" button
```

### Phase 2: Import Progress

```
Importing... [============      ] 12/25 emails
Found 8 transactions to review
```

Show progress: list → get → parse → save for each email.

### Phase 3: Review Screen

New route or modal: `/import/review`

**Design mockup (textual):**

```
┌─────────────────────────────────────────────────────┐
│  ⬅ Importaciones Pendientes                    [8]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─ Suggested Transaction ────────────────────────┐ │
│  │  🏦 Mercado Pago     • 12 Jun 2026             │ │
│  │                                                 │ │
│  │  💳 $1,500  →  NETFLIX                          │ │
│  │  Cuenta: [ Daily Budget ▼ ]                     │ │
│  │                                                 │ │
│  │  [✏ Edit]     [✓ Approve]     [✗ Reject]      │ │
│  │                                                 │ │
│  │  ───────────────────────────────────────────    │ │
│  │  Original: "Compra en NETFLIX por $1,500.00"   │ │
│  └─────────────────────────────────────────────────┘ │
│                                                     │
│  ┌─ Suggested Transaction ────────────────────────┐ │
│  │  🏦 BancoEstado      • 10 Jun 2026             │ │
│  │  💰 +$5,000  ←  Juan Perez (Transferencia)     │ │
│  │  Cuenta: [ Savings ▼ ]                          │ │
│  │  [✓ Approve]     [✗ Reject]                    │ │
│  └─────────────────────────────────────────────────┘ │
│                                                     │
│  [ ✓ Approve All ]  [ ✗ Reject All Pending ]       │
└─────────────────────────────────────────────────────┘
```

### Modal for Editing Before Approval

Reuse `TransactionModal` pattern with pre-filled values:
- Amount → `parsedAmount / 100` (convert cents to display)
- Description → `parsedEntity`
- Type → inferred from `parsedType` (expense/income toggle)
- Account → let user choose
- Date → `parsedDate`

### UX States

| State | What User Sees | Action |
|-------|---------------|--------|
| **No connection** | "Connect Gmail" button | Triggers OAuth |
| **Importing** | Progress bar, count | Wait |
| **Pending review** | List of parsed transactions | Approve/Reject/Edit |
| **Approved** | Transaction appears in History | Normal flow |
| **Rejected** | Transaction hidden | Can be shown in filter |
| **Empty** | "No new transactions to import" | — |

### Bulk Operations

- **"Approve All"** — batch approves all pending with current parsing
- **"Reject All"** — batch rejects
- **Filter by bank** — focus on one bank at a time

### New i18n Keys Needed

Add to `language-context.tsx`:
```typescript
// en
gmailImport: 'Import from Gmail',
connectGmail: 'Connect Gmail',
pendingReview: 'Pending Review',
importedTransactions: 'Imported Transactions',
approve: 'Approve',
reject: 'Reject',
approveAll: 'Approve All',
rejectAll: 'Reject All',
importProgress: 'Importing... {current}/{total}',
noPendingImport: 'No pending imports',
selectAccountForImport: 'Account for import',
bankName: 'Bank',
originalEmail: 'Original Email',
importConfidence: 'Parsing confidence',
```

---

## 7. Recommended Libraries & Dependencies

### Core Dependencies

| Package | Purpose | Type | Why |
|---------|---------|------|-----|
| `@googleapis/gmail` | Gmail API client (lighter) | dependency | For listing and reading emails |
| `next-auth@beta` (Auth.js v5) | OAuth 2.0 with Google provider | dependency | Handles Google OAuth flow, session management |
| `@auth/core` | Auth.js core | dependency | Required by next-auth v5 |

### Alternative: Avoid next-auth

If the app stays single-user and doesn't need auth beyond Google OAuth for Gmail, a simpler approach:

| Package | Purpose | Type |
|---------|---------|------|
| `googleapis` | Full Google API client | dependency |
| `jose` | JWT for local token storage | dependency |

**Simpler flow:** Use Google OAuth directly without next-auth:
1. User clicks "Connect Gmail" → redirect to Google
2. Handle callback in `app/api/gmail/callback/route.ts`
3. Store refresh token encrypted in localStorage or httpOnly cookie
4. Use `googleapis` `OAuth2Client` for API calls

This is simpler for a single-user app.

### Dev Dependencies

| Package | Purpose | Type |
|---------|---------|------|
| `@types/google-publisher-tag` | Types | devDependency | 

(None really needed — `googleapis` has built-in types.)

### What NOT to add (v1)

- `openai` — Don't add LLM parsing yet. Use regex/template approach first.
- `@supabase/·` — Backend not ready. Use local API routes.
- `prisma` / `drizzle` — Overkill while DB schema is fluid.
- `nylas` / `emailengine` — Third-party email API services, not needed for single-user.

---

## 8. Risks & Edge Cases

### Security Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Refresh token stolen** | Full Gmail read access | Store encrypted, use httpOnly cookies, leverage Google's token expiration |
| **OAuth token leakage** | Access to user's email | Use server-only API routes, never expose tokens to client |
| **Email body logging** | PII in logs | Scrub PII from logs, don't log raw email content |
| **Refresh token expires** | User must re-auth | Handle `RefreshError` gracefully, show "reconnect" UI |
| **OAuth scope creep** | Accidental permission expansion | Use most restrictive scope (`gmail.readonly`), audit regularly |

### Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Gmail API rate limits** | Throttling, 429 errors | Implement exponential backoff, batch requests, respect `Retry-After` |
| **Email format changes** | Parsing breaks for a bank | Monitoring/alerting on parse failure rate, fallback to manual entry |
| **Duplicate imports** | Double-counted transactions | UNIQUE constraint on `gmail_message_id`, pre-check before insert |
| **Large initial import** | Thousands of emails, slow first sync | Paginate, process in batches of 50, show progress |
| **Email encoding issues** | Garbled body text | Handle base64url decoding, detect UTF-8 vs Latin-1 |
| **Gmail API changes** | Endpoints change/deprecate | Pin @googleapis/gmail version, monitor changelog |
| **Google OAuth consent expiry** | Auth fails silently | Check token validity before calls, prompt re-auth |
| **Threaded email replies** | Multiple messages in one thread | Import each message individually by ID, not by thread |

### UX Risks

| Risk | Mitigation |
|------|-----------|
| **Wrong amount parsed** | Show raw email snippet alongside parsed result, let user edit before approving |
| **Wrong merchant name** | User can edit description field before approval |
| **Income misclassified as expense** | Use context clues (keywords like "transferencia recibida", "abono") to infer type, let user toggle |
| **User accidentally approves duplicates** | Dedup by gmail_message_id prevents same email from being imported twice, but same transaction notified via different channels (SMS + email) still shows twice |
| **"It imported transactions from 3 years ago"** | Default query to last 90 days, user can configure range |
| **Multiple Gmail accounts** | Handle one account in v1, add multi-account support later |

### Gmail API Specific Gotchas

1. **Refresh token only on first auth**: Google returns `refresh_token` ONLY the FIRST time the user authorizes. If the user revokes access and re-authorizes, a new refresh_token IS returned. If they just re-authorize normally, it returns null. Store it carefully.

2. **Format=full is expensive**: `messages.get` with `format=full` costs 20 units vs 5 units for basic listing. Strategy: list with metadata first, only fetch full body for new/unprocessed messages.

3. **Base64URL encoding**: Email body is base64url-encoded. Must decode properly. The `raw` field uses a different key.

4. **`q` parameter limitations**: Cannot search by `gmail_message_id`. To check if a message exists, you must either store IDs locally or use paginated listing with date filters.

5. **History ID tracking**: After initial import, track `gmailHistoryId` to only fetch changes via `history.list` (2 units each) instead of re-scanning inbox.

### Recovery Procedures

- **If OAuth fails**: Show clear "Reconnect Gmail" button, delete stale tokens
- **If parsing fails for an email**: Show the raw email to the user for manual entry
- **If rate limited**: Queue remaining work, retry with backoff (up to 3 attempts)
- **If user deletes a transaction created from import**: Normal `removeTransaction()` handles it (the `transaction_id` FK becomes orphaned — acceptable for MVP)

---

## 9. Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Create `app/api/auth/gmail/route.ts` — OAuth init endpoint
- [ ] Create `app/api/auth/gmail/callback/route.ts` — OAuth callback
- [ ] Create `app/api/gmail/import/route.ts` — List + fetch + parse
- [ ] Add `ImportedTransaction` type to `types/index.ts`
- [ ] Add `GmailAccount` management (store encrypted tokens)
- [ ] Set up environment variables (Google Client ID, Secret)

### Phase 2: Parsing Engine (Week 2)
- [ ] Build parser registry `lib/import/parsers/registry.ts`
- [ ] Build template matcher for 3 most common banks
- [ ] Build generic fallback parser (regex heuristics)
- [ ] Build amount normalizer (handle CLP, USD, MXN formats)
- [ ] Write unit tests for parsers (`tests/unit/import/`)
- [ ] Write Playwright tests for import flow

### Phase 3: Review UI (Week 2-3)
- [ ] Create `components/import-review.tsx` — main import list view
- [ ] Create `components/import-transaction-card.tsx` — individual item
- [ ] Create `components/modals/import-edit-modal.tsx` — edit before approval
- [ ] Add "Import" tab to navbar
- [ ] Add i18n keys for all import-related strings
- [ ] Wire approve/reject to create Transactions via `useBudget()`

### Phase 4: Polish & Edge Cases (Week 3)
- [ ] Add incremental sync via `history.list`
- [ ] Add progress indicator for initial import
- [ ] Handle 429 rate limits with retry logic
- [ ] Handle token refresh failure
- [ ] Add confidence indicator in UI
- [ ] Test with real bank emails (BancoEstado, Mercado Pago, STP, etc.)

---

## 10. File Manifest (Files to Create/Modify)

### New Files
```
app/api/auth/gmail/route.ts              # OAuth init
app/api/auth/gmail/callback/route.ts      # OAuth callback
app/api/gmail/sync/route.ts               # Sync endpoint (list + fetch + parse)
app/api/gmail/messages/route.ts           # Get single message
lib/import/oauth.ts                       # Google OAuth helpers
lib/import/gmail.ts                       # Gmail API client wrappers
lib/import/parsers/registry.ts            # Parser registry
lib/import/parsers/base.ts                # Base parser interface
lib/import/parsers/mercadopago.ts         # Mercado Pago parser
lib/import/parsers/bancoestado.ts         # BancoEstado parser
lib/import/parsers/generic.ts             # Generic fallback parser
lib/import/normalize.ts                   # Amount/date normalization
lib/import/types.ts                       # Import-related types
lib/import/store.ts                       # Client-side storage for import state
components/import-review.tsx              # Import review list
components/import-transaction-card.tsx    # Individual import card
components/modals/import-edit-modal.tsx   # Edit import before approval
hooks/use-gmail-import.tsx                # Hook for import state management
```

### Modified Files
```
types/index.ts                            # Add ImportedTransaction, ImportStatus
hooks/use-budget.tsx                      # Add importedTransactions, approve/reject methods
components/navbar.tsx                     # Add "Import" tab
contexts/language-context.tsx             # Add import i18n keys
app/layout.tsx                            # Maybe add import provider
next.config.mjs                           # Add env vars
package.json                              # Add dependencies
.gitignore                                # Uncomment .env*, add .env.local
```

---

## Ready for Proposal

✅ **Yes** — this analysis is comprehensive enough to write the PRD and move to the proposal phase.

### Key Decisions the Proposal Must Address

1. **Auth strategy**: Use `next-auth` (Auth.js v5) or custom Google OAuth? For a single-user app, custom OAuth is simpler.

2. **Backend approach**: API routes only for v1, or start building the planned Cloudflare D1 backend now? API routes are pragmatic.

3. **Token storage**: Encrypted localStorage + httpOnly cookie, or just server-side storage in API routes?

4. **Parser priority**: Which banks/email senders to support first? Since the app defaults to CLP, Chilean banks should be priority (BancoEstado, Banco de Chile, Santander, Mercado Pago, STP).

5. **Push vs Poll**: Implement `users.watch` for real-time import, or poll on a schedule / manual refresh?

6. **Single vs Multi Gmail account**: Start with one account or plan for multiple from the start?
