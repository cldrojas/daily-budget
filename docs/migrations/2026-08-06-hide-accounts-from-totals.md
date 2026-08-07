# Migración: hide-accounts-from-totals

Fecha: 2026-08-06

## Cambio de schema

`Account.hidden?: boolean` (opcional, default `undefined`/`false`)

```
Account {
  id: string
  name: string
  type: string
  balance: Int
  icon: string
  hidden?: boolean  // NUEVO
}
```

## Estrategia de datos

Los datos existentes en localStorage no tienen el campo → se leen como
`undefined` (falsy) = visible. No requiere transformación.

Los objetos de cuenta creados por `addAccount`, `setupBudget`, `updateConfig`
y la cuenta `savings` reinjectada no setean el campo (se lee como falsy).

## Rollback

Eliminar el campo `hidden?` de `Account`. Los datos con `hidden: true`
se ignoran al re-leer el schema (la cuenta vuelve a ser visible en totales
y dropdown).
