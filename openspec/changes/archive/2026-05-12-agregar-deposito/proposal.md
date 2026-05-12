# Proposal: Agregar Depósito

## Intent

Enable users to deposit (income) money into any account. Currently the app only supports expense tracking via `TransactionModal`, which defaults to `expense` type and hides income transactions from the list. Users need a way to record deposits to track their account balances accurately.

## Scope

### In Scope
- Add type selector (tabs or toggle) to `TransactionModal` to switch between Expense and Income modes
- Connect existing `addIncome` language translations to the Income mode in `TransactionModal`
- Update `TransactionsList` to show income transactions alongside expenses (remove filter on line 36)
- Ensure `useBudget.addTransaction()` handles income type correctly (already supports it)

### Out of Scope
- Income categorization (future enhancement)
- Recurring deposits automation
- Export transactions to CSV/PDF

## Approach

**Option A: Extend TransactionModal with tabs** (Recommended)

Add a tabbed interface at the top of `TransactionModal`:
- Tab 1: "Gasto" (Expense) — current behavior
- Tab 2: "Ingreso" (Income) — enables deposit form

Tab state controls:
- Form title ("Agregar Gasto" vs "Agregar Ingreso")
- Type passed to `addTransaction()`
- Color scheme (red for expense, green for income)

**Alternative**: Toggle button at top of modal. Tabs preferred for clarity.

## Affected Areas

| Area | Impact | Description |
|------|--------|--------------|
| `components/TransactionModal.tsx` | Modified | Add type selector UI, toggle between expense/income |
| `hooks/use-budget.tsx` | No change | Already supports income type in `addTransaction()` |
| `components/TransactionsList.tsx` | Modified | Remove expense-only filter (line ~36) |
| `i18n/locales/*.json` | No change | Translations already exist for addIncome |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|-------------|
| Income not appearing in list | Low | Verify filter removal in TransactionsList |
| Form validation incompatible with income | Low | Test both modes before merge |
| Color/accessibility issues with dual theme | Low | Use semantic colors consistent with shadcn/ui |

## Rollback Plan

1. Revert `TransactionModal.tsx` to remove type selector
2. Restore filter in `TransactionsList.tsx` (line 36)
3. No database migrations needed — localStorage schema unchanged

## Dependencies

- None — all required infrastructure exists (`useBudget.addTransaction()` supports income, translations exist)

## Success Criteria

- [ ] User can switch between "Gasto" and "Ingreso" tabs in TransactionModal
- [ ] Income transactions appear in TransactionsList alongside expenses
- [ ] Account balance updates correctly when adding income
- [ ] UI accessible and consistent with existing design patterns