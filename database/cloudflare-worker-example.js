// Example Cloudflare Worker handlers for Cloudflare D1
// Note: This file is a template. Configure your Worker with a D1 binding named DB.

addEventListener('fetch', (event) => {
  event.respondWith(handle(event.request))
})

async function handle(request) {
  const url = new URL(request.url)
  const pathname = url.pathname

  // simple router
  if (request.method === 'GET' && pathname === '/accounts') {
    return listAccounts()
  }
  if (request.method === 'POST' && pathname === '/import') {
    const body = await request.json()
    return importData(body)
  }

  return new Response('Not found', { status: 404 })
}

async function listAccounts() {
  // DB is the D1 binding configured in wrangler.toml
  const res = await DB.prepare('SELECT * FROM accounts').all()
  return new Response(JSON.stringify(res.results || []), {
    headers: { 'content-type': 'application/json' }
  })
}

async function importData(body) {
  // body expected to be the root object exported from localStorage
  try {
    const { accounts = [], transactions = [], budget } = body

    const tx = DB.batch()

    for (const a of accounts) {
      await tx.prepare('INSERT OR REPLACE INTO accounts (id,name,type,balance,icon,parent_id) VALUES (?,?,?,?,?,?)').bind(
        a.id,
        a.name ?? a.nombre ?? '',
        a.type ?? null,
        a.balance ?? a.amount ?? 0,
        a.icon ?? null,
        a.parentId ?? a.parent ?? null
      ).run()
    }

    for (const t of transactions) {
      await tx.prepare('INSERT OR REPLACE INTO transactions (id,type,date,amount,description,account) VALUES (?,?,?,?,?,?)').bind(t.id,t.type,t.date ? new Date(t.date).toISOString() : new Date().toISOString(),t.amount,t.description ?? null,t.account).run()
    }

    if (budget) {
  await tx.prepare('INSERT OR REPLACE INTO budgets (id,start_amount,start_date,end_date) VALUES (?,?,?,?)').bind('budget-1',budget.startAmount ?? 0,budget.startDate ? new Date(budget.startDate).toISOString() : null,budget.endDate ? new Date(budget.endDate).toISOString() : null).run()
    }

    await tx.commit()

    return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500, headers: { 'content-type': 'application/json' } })
  }
}
