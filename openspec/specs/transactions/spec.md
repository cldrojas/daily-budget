# Transactions — Deposit (Income) Support

## Purpose

Add income/deposit support to the existing expense-only transaction flow. Users can record money coming into any account, see income alongside expenses in transaction lists, and have account balances update correctly.

## Requirements

### FR-01: Type Selector in TransactionModal

The TransactionModal SHALL display a tabbed selector at the top to switch between "Gasto" (Expense) and "Ingreso" (Income) modes.

- The active tab SHALL visually indicate the selected mode using shadcn/ui Tabs (or equivalent segmented control).
- Switching tabs SHALL reset the form fields (amount, description, date) to defaults.
- The type state SHALL update accordingly: `'expense'` or `'income'`.

#### Scenario: Switch mode from Expense to Income

- GIVEN the TransactionModal is open in Expense mode
- WHEN the user clicks the "Ingreso" tab
- THEN the form resets to defaults (amount=0, description="", date=today)
- AND the type becomes `'income'`

#### Scenario: Switch back preserves empty form

- GIVEN the TransactionModal is open in Income mode
- WHEN the user clicks the "Gasto" tab
- THEN the form resets and type becomes `'expense'`

### FR-02: Income Mode Form Behavior

When Income mode is active, the TransactionModal SHALL display income-appropriate labels and omit expense-specific warnings.

- Dialog title SHALL use `t('addIncome')` / `t('addIncomeDescription')` instead of expense equivalents.
- Description placeholder SHALL show a generic prompt (e.g., "What's this for?") — currently `t('whatExpenseFor')` SHALL be reused, or a new `whatIncomeFor` translation MAY be introduced.
- The expense-over-budget warning (`expenseExceedsWarning`) SHALL NOT appear in Income mode.
- Submit button SHALL show income-appropriate icon and text.

#### Scenario: Income mode shows correct labels

- GIVEN the TransactionModal is open in Income mode
- WHEN the user views the dialog header
- THEN the title reads "Agregar ingreso" (ES) or "Add Income" (EN)
- AND the budget warning is NOT visible

#### Scenario: Submit income transaction

- GIVEN the user is in Income mode with amount=5000, description="Salary"
- WHEN they click the submit button
- THEN `onAddTransaction` is called with `{ type: 'income', amount: 5000, description: 'Salary', ... }`
- AND a success toast appears with `t('incomeAdded')` / `t('incomeAddedDescription')`

### FR-03: Budget Hook Handles Income Type

The `useBudget.addTransaction()` function SHALL handle `type === 'income'` by creating a transaction with a **positive** amount and **adding** to the selected account's balance.

- Expense: `amount = -value`, subtract from balance.
- Income: `amount = +value`, add to balance.
- Daily budget mode: income SHALL increase the `dailyAllowance` and `remainingToday` proportionally.

#### Scenario: Income added to daily account

- GIVEN the daily account has balance 10000 and remainingToday is 5000
- WHEN `addTransaction({ type: 'income', amount: 3000, account: 'daily' })` is called
- THEN a new transaction with `amount: 3000` is created
- AND the daily account balance becomes 13000
- AND `remainingToday` increases by 3000

#### Scenario: Income added to savings account

- GIVEN the savings account has balance 20000
- WHEN `addTransaction({ type: 'income', amount: 5000, account: 'savings' })` is called
- THEN the savings account balance becomes 25000

### FR-04: TransactionsList Shows All Types

The TransactionsList component SHALL display both expense and income transactions, not only expenses.

- Remove the `.filter(t => t.amount < 0)` on line 36.
- Show income transactions with a **green** amount color (`text-green-500`).
- Show expense transactions with **red** amount color (`text-red-500`) as before.
- Empty state message SHALL be type-agnostic (e.g., "No transactions yet").
- Card title SHALL be updated to type-agnostic wording (e.g., "Recent Activity").

#### Scenario: TransactionList shows expense and income

- GIVEN the user has one expense (-2000) and one income (5000) transaction
- WHEN the TransactionsList renders
- THEN both transactions appear in the list
- AND the expense amount is shown in red
- AND the income amount is shown in green

### FR-05: TransactionHistory Visual Distinction

The TransactionHistory component SHALL color positive amounts green (`text-green-500`) and continue to color negative amounts red (`text-red-500`).

#### Scenario: History shows income in green

- GIVEN a transaction with amount 5000 (type: 'income')
- WHEN TransactionHistory renders
- THEN the amount cell shows "5000" in green

### FR-06: Income-Specific Translations

The following translation keys SHALL be added for income-specific toasts and labels:

| Key | EN | ES |
|-----|----|----|
| `incomeAdded` | "Income Added" | "Ingreso registrado" |
| `incomeAddedDescription` | "{amount} has been added." | "{amount} fue agregado." |
| `recentActivity` | "Recent Activity" | "Actividad reciente" |
| `recentActivityDescription` | "All your recent transactions" | "Todas tus transacciones recientes" |
| `noTransactions` | "No transactions yet" | "Aún no hay transacciones" |
| `unnamedIncome` | "Unnamed Income" | "Ingreso sin nombre" |

Existing keys `addIncome`, `addIncomeDescription` are already present and require no changes.

#### Scenario: Income toast appears after adding deposit

- GIVEN the user adds an income of 5000
- WHEN the transaction is submitted
- THEN a toast appears with title "Ingreso registrado" (ES) or "Income Added" (EN)

## Visual / UX Specifications

| Element | Expense Mode | Income Mode |
|---------|-------------|-------------|
| Tab label | "Gasto" / "Expense" | "Ingreso" / "Income" |
| Tab active color | Red (`bg-red-50`/`text-red-600`) | Green (`bg-green-50`/`text-green-600`) |
| Dialog title | `t('addExpense')` | `t('addIncome')` |
| Dialog description | `t('addExpenseDescription')` | `t('addIncomeDescription')` |
| Submit icon | `<PlusCircle />` | `<PlusCircle />` (or `<ArrowDown />` for income) |
| Amount color (lists) | `text-red-500` | `text-green-500` |
| Budget warning | Visible | Hidden |

## Acceptance Criteria

1. ✅ User can toggle between Gasto/Ingreso tabs in TransactionModal
2. ✅ Income form shows correct labels, omits budget warning
3. ✅ Income transaction amount is stored as positive Int
4. ✅ Account balance increases when income is added
5. ✅ TransactionsList shows both expense (red) and income (green)
6. ✅ TransactionHistory shows income amounts in green
7. ✅ All toast messages and labels use correct translations for language
