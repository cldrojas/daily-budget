# Design: Agregar Depósito

## Technical Approach

Extend TransactionModal with Radix UI Tabs to toggle Expense/Income mode. Fix `useBudget.addTransaction()` to handle income (currently expense-only at line 262). Remove expense-only filter from TransactionsList; add green coloring for income amounts in both lists. Pure frontend change — no schema or backend.

## Architecture Decisions

### Decision: Type Selector UI
| Alternative | Tradeoff | Decision |
|---|---|---|
| Radix Tabs | Already in project (`components/ui/tabs.tsx`), matches shadcn/ui | Adopt |
| Toggle button | Custom styling, less visual hierarchy | Reject |
| Select dropdown | Over-engineered for 2 options | Reject |

### Decision: Type State Management
| Alternative | Tradeoff | Decision |
|---|---|---|
| Local state in TransactionModal | Simple, no coupling | Adopt |
| Global context/zustand | Over-engineered for single-modal concern | Reject |

### Decision: Income Sign Convention
| Alternative | Tradeoff | Decision |
|---|---|---|
| Positive amount, add to balance | Matches existing `setupBudget`/`addAccount` income patterns | Adopt |
| Negative amount, subtract | Confusing inversion | Reject |

### Decision: Description Placeholder
| Alternative | Tradeoff | Decision |
|---|---|---|
| Reuse `whatExpenseFor` in income mode | No i18n change, but label says "What's this expense for?" | Reject |
| New `whatIncomeFor` key | Clear labeling, requires i18n additions | Adopt |

## Data Flow

```
User clicks "Add" → TransactionModal opens
  ├─ Tab "Gasto"  → type='expense'
  └─ Tab "Ingreso" → type='income'
      └─ Submit → onAddTransaction({ type, amount, ... })
          └─ useBudget.addTransaction()
              ├─ type='expense'  → amount=-value, subtract from balance
              └─ type='income'   → amount=+value, add to balance
                  ├─ TransactionsList: both types, red/green colors
                  └─ TransactionHistory: green for positive amounts
```

## File Changes

| File | Action | Description |
|---|---|---|
| `hooks/use-budget.tsx` | Modify | Add `type === 'income'` branch in `addTransaction()` (after line 262) |
| `components/modals/transaction-modal.tsx` | Modify | Add Radix Tabs, conditional labels/warnings/reset |
| `components/transactions-list.tsx` | Modify | Remove `.filter(t => t.amount < 0)` (line 36), green for income, update titles |
| `components/transaction-history.tsx` | Modify | Add `text-green-500` for positive amounts (FR-05) |
| `contexts/language-context.tsx` | Modify | Add 7 new translation keys (FR-06) |

## Interfaces / Contracts

### addTransaction — Before vs After
| Type | Before | After |
|---|---|---|
| `'expense'` | ✅ amount=-value, subtract from balance | ✅ Same (unchanged) |
| `'income'` | ❌ No-op (ignored by expense-only guard) | ✅ amount=+value, add to balance |
| `'transfer'` | ❌ No-op | ❌ No-op (handled by `transferFunds`) |

### Income Branch Logic (new, after line 262)
```
Create tx with positive amount (toInt(amount))
If account === 'daily' in budget mode:
  Add amount to account balance AND remainingToday/dailyAllowance
Else:
  Add amount to account balance only
Prepend tx to transactions list
```

## Error Handling

- Same validation applies to both modes (amount > 0, whole number)
- No balance overflow protection needed — Int is a tagged number type
- Budget mode: income increases both balance and remainingToday proportionally
- Edit mode: preserves original transaction type, tabs show correct active state

## Migration / Rollout

No migration required. All localStorage. Existing expense transactions unchanged.

## Open Questions

- [ ] Resolve income submit icon — `<PlusCircle />` (same as expense) vs `<ArrowDown />` (distinct)
