# Tasks: Agregar Depósito

## Phase 1: Foundation

- [ ] 1.1 **language-context.tsx** — Add 6 new keys to `translations.en` + `translations.es`:
      `incomeAdded`, `incomeAddedDescription`, `recentActivity`,
      `recentActivityDescription`, `unnamedIncome`, `whatIncomeFor`.
      Note: `noTransactions` already exists — skip.
- [ ] 1.2 **use-budget.tsx** — Add `type === 'income'` branch in `addTransaction()` (after line 262).
      Create tx with `amount: toInt(amount)` (positive), **add** to balance. If `account === 'daily'`
      in budget mode, also increase `remainingToday` / `dailyAllowance`.

## Phase 2: UI Implementation

- [ ] 2.1 **transaction-modal.tsx** — Import Tabs/TabsList/TabsTrigger from `@/components/ui/tabs`.
      Add Tabs above the form with "Gasto"/"Ingreso" triggers. Active state red for expense,
      green for income. Switching tab resets form fields (amount=0, desc="", date=today).
- [ ] 2.2 **transaction-modal.tsx** — Conditional labels: title=`t('addIncome')` in income mode,
      submit toast uses `t('incomeAdded')`. Budget warning hidden in income mode.
      Description placeholder: `t('whatIncomeFor')` in income mode.
- [ ] 2.3 **transactions-list.tsx** — Remove `.filter(t => t.amount < 0)` (line 36). Iterate all
      transactions. Color: `text-green-500` for income, `text-red-500` for expenses.
      Update titles: `t('recentActivity')` / `t('recentActivityDescription')`.
      Fallback name: `t('unnamedIncome')` for income, `t('unnamedExpense')` for expenses.
      Empty state: `t('noTransactions')`.
- [ ] 2.4 **transaction-history.tsx** — Change line 47 conditional coloring:
      `transaction.amount < 0 ? "text-red-500" : "text-green-500"`.

## Phase 3: Verification

- [ ] 3.1 **End-to-end** — Verify all 7 spec scenarios pass: type switch resets, income labels,
      income submission, positive amount storage, balance increase, list shows both types
      with correct colors, income toast in correct language.

## Dependencies

```
1.1 (translations) ─┐
                    ├──> 2.1 + 2.2 (TransactionModal)
1.2 (useBudget) ────┘
                     └──> 2.3 (TransactionsList) ──> 3.1 (e2e)
1.1 ──> 2.3 ──> 3.1
1.2 ──> 2.4 ──> 3.1
```

## Batch Grouping for sdd-apply

| Batch | Tasks | Rationale |
|-------|-------|-----------|
| A | 1.1 + 1.2 + 2.4 | No deps, all independent |
| B | 2.1 + 2.2 + 2.3 | Depends on Batch A (translations + hook) |
| C | 3.1 | Depends on Batch B (all implemented) |
