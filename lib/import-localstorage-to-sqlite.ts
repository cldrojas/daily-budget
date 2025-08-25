/*
  Utility script to import a local JSON export (from localStorage `daily-budget-data`)
  into a local SQLite file. Useful to populate a local DB before migrating to Cloudflare D1.

  Usage:
    node ./lib/import-localstorage-to-sqlite.ts path/to/export.json path/to/db.sqlite

  NOTE: This is a Node script that uses `better-sqlite3`. Install with:
    pnpm add better-sqlite3
*/

import fs from 'fs'
import Database from 'better-sqlite3'

type Root = {
  budget?: any
  accounts?: any[]
  transactions?: any[]
  dailyAllowance?: number
  remainingToday?: number
  progress?: number
  lastCheckedDay?: string | null
  isSetup?: boolean
}

const [,, jsonPath, dbPath] = process.argv
if (!jsonPath || !dbPath) {
  console.error('Usage: node import-localstorage-to-sqlite.ts path/to/export.json path/to/db.sqlite')
  process.exit(2)
}

const raw = fs.readFileSync(jsonPath, 'utf-8')
const data: Root = JSON.parse(raw)

const db = new Database(dbPath)

// Run migrations (simple): create tables if not exists
const migration = fs.readFileSync('./database/migrations/001_init.sql', 'utf-8')
db.exec(migration)

const insertAccount = db.prepare(`INSERT OR REPLACE INTO accounts (id,name,type,balance,icon) VALUES (@id,@name,@type,@balance,@icon)`)
const insertTransaction = db.prepare(`INSERT OR REPLACE INTO transactions (id,type,date,amount,description,account) VALUES (@id,@type,@date,@amount,@description,@account)`)

const insertBudget = db.prepare(`INSERT OR REPLACE INTO budgets (id,start_amount,start_date,end_date) VALUES (@id,@start_amount,@start_date,@end_date)`)
const insertSetting = db.prepare(`INSERT OR REPLACE INTO settings (key,value) VALUES (@key,@value)`)

const tx = db.transaction(() => {
  if (data.accounts && Array.isArray(data.accounts)) {
    for (const a of data.accounts) {
      insertAccount.run({
        id: a.id,
        name: a.name,
        type: a.type,
        balance: a.balance ?? 0,
        icon: a.icon ?? null
      })
    }
  }

  if (data.transactions && Array.isArray(data.transactions)) {
    for (const t of data.transactions) {
      insertTransaction.run({
        id: t.id,
        type: t.type,
        date: (t.date && new Date(t.date).toISOString()) || new Date().toISOString(),
        amount: t.amount,
        description: t.description ?? null,
        account: t.account
      })
    }
  }

  if (data.budget) {
    insertBudget.run({
      id: 'budget-1',
      start_amount: data.budget.startAmount ?? 0,
      start_date: data.budget.startDate ? new Date(data.budget.startDate).toISOString() : null,
      end_date: data.budget.endDate ? new Date(data.budget.endDate).toISOString() : null
    })
  }

  // store simple settings
  insertSetting.run({ key: 'dailyAllowance', value: String(data.dailyAllowance ?? '') })
  insertSetting.run({ key: 'remainingToday', value: String(data.remainingToday ?? '') })
  insertSetting.run({ key: 'progress', value: String(data.progress ?? '') })
  insertSetting.run({ key: 'lastCheckedDay', value: String(data.lastCheckedDay ?? '') })
  insertSetting.run({ key: 'isSetup', value: String(data.isSetup ?? '') })
})

try {
  tx()
  console.log('Import completed')
} catch (err) {
  console.error('Import failed', err)
  process.exit(1)
}

db.close()
