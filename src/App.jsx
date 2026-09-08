import { useState, useEffect, useMemo } from 'react'
import heroImg from './assets/hero.png'
import './App.css'

const CURRENCIES = [
  { code: 'PHP', name: 'Philippine Peso',   symbol: '₱'  },
  { code: 'USD', name: 'US Dollar',         symbol: '$'  },
  { code: 'SGD', name: 'Singapore Dollar',  symbol: 'S$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'EUR', name: 'Euro',              symbol: '€'  },
  { code: 'GBP', name: 'British Pound',     symbol: '£'  },
  { code: 'JPY', name: 'Japanese Yen',      symbol: '¥'  },
  { code: 'HKD', name: 'Hong Kong Dollar',  symbol: 'HK$'},
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'THB', name: 'Thai Baht',         symbol: '฿'  },
]

const CATEGORIES = [
  'Food', 'Transport', 'Housing', 'Entertainment',
  'Healthcare', 'Shopping', 'Utilities', 'Other',
]

const CATEGORY_COLORS = {
  Food: '#ef6f53',
  Transport: '#4c8bf5',
  Housing: '#a06bd4',
  Entertainment: '#f2b134',
  Healthcare: '#2fb7a0',
  Shopping: '#ec5a96',
  Utilities: '#7c8aa5',
  Other: '#9aa1ac',
}

const LS_EXPENSES = 'expense-logger-expenses'
const LS_CURRENCY = 'expense-logger-currency'
const LS_THEME = 'expense-logger-theme'
const LS_BUDGETS = 'expense-logger-budgets'

function fmt(symbol, amount) {
  return `${symbol}${Number(amount).toLocaleString('en', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function thisYearMonth() {
  return new Date().toISOString().slice(0, 7)
}

function labelFor(ym) {
  return new Date(`${ym}-15`).toLocaleDateString('en', { month: 'long', year: 'numeric' })
}

function shiftMonth(ym, delta) {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const emptyForm = () => ({
  date: new Date().toISOString().slice(0, 10),
  description: '',
  amount: '',
  category: 'Food',
})

export default function App() {
  const [expenses, setExpenses] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_EXPENSES)) ?? [] }
    catch { return [] }
  })

  const [currencyCode, setCurrencyCode] = useState(
    () => localStorage.getItem(LS_CURRENCY) ?? 'PHP'
  )

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem(LS_THEME)
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  })

  const [budgets, setBudgets] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_BUDGETS)) ?? {} }
    catch { return {} }
  })

  const [month, setMonth] = useState(thisYearMonth)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('All')

  const currency = CURRENCIES.find(c => c.code === currencyCode) ?? CURRENCIES[0]

  useEffect(() => { localStorage.setItem(LS_EXPENSES, JSON.stringify(expenses)) }, [expenses])
  useEffect(() => { localStorage.setItem(LS_CURRENCY, currencyCode) }, [currencyCode])
  useEffect(() => { localStorage.setItem(LS_THEME, theme) }, [theme])
  useEffect(() => { localStorage.setItem(LS_BUDGETS, JSON.stringify(budgets)) }, [budgets])

  function onChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  function submitForm(e) {
    e.preventDefault()
    const amt = parseFloat(form.amount)
    if (!form.description.trim() || !amt || amt <= 0) return
    const entry = {
      id: editingId ?? crypto.randomUUID(),
      date: form.date,
      description: form.description.trim(),
      amount: amt,
      category: form.category,
    }
    setExpenses(prev => {
      const next = editingId
        ? prev.map(x => (x.id === editingId ? entry : x))
        : [entry, ...prev]
      return next.sort((a, b) => b.date.localeCompare(a.date))
    })
    setForm(emptyForm())
    setEditingId(null)
    setMonth(form.date.slice(0, 7)) // jump to the month we just added/edited into
  }

  function startEdit(exp) {
    setEditingId(exp.id)
    setForm({ date: exp.date, description: exp.description, amount: String(exp.amount), category: exp.category })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm())
  }

  function deleteExpense(id) {
    setExpenses(prev => prev.filter(e => e.id !== id))
    if (editingId === id) cancelEdit()
  }

  function setBudget(value) {
    setBudgets(prev => {
      const next = { ...prev }
      const num = parseFloat(value)
      if (!value || isNaN(num) || num <= 0) delete next[month]
      else next[month] = num
      return next
    })
  }

  // ---- Derived data for the selected month ----
  const monthExpenses = useMemo(
    () => expenses.filter(e => e.date.startsWith(month)),
    [expenses, month]
  )

  const monthTotal = useMemo(
    () => monthExpenses.reduce((s, e) => s + e.amount, 0),
    [monthExpenses]
  )

  const visibleExpenses = useMemo(() => {
    const q = search.trim().toLowerCase()
    return monthExpenses.filter(e => {
      if (filterCat !== 'All' && e.category !== filterCat) return false
      if (q && !e.description.toLowerCase().includes(q) && !e.category.toLowerCase().includes(q)) return false
      return true
    })
  }, [monthExpenses, search, filterCat])

  const byCategory = useMemo(() => (
    CATEGORIES
      .map(cat => ({ cat, total: monthExpenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0) }))
      .filter(c => c.total > 0)
      .sort((a, b) => b.total - a.total)
  ), [monthExpenses])

  const budget = budgets[month] ?? ''
  const budgetNum = parseFloat(budget) || 0
  const pct = budgetNum > 0 ? Math.min(100, (monthTotal / budgetNum) * 100) : 0
  const over = budgetNum > 0 && monthTotal > budgetNum

  // ---- Exports (current month) ----
  function exportCSV() {
    const header = ['Date', 'Description', 'Category', `Amount (${currency.code})`]
    const rows = monthExpenses.map(e => [e.date, e.description, e.category, e.amount.toFixed(2)])
    const csv = [header, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    downloadBlob(new Blob([csv], { type: 'text/csv' }), `expenses-${month}.csv`)
  }

  async function exportExcel() {
    const XLSX = await import('xlsx')
    const data = monthExpenses.map(e => ({
      Date: e.date,
      Description: e.description,
      Category: e.category,
      [`Amount (${currency.code})`]: e.amount,
    }))
    data.push({ Date: '', Description: '', Category: 'TOTAL', [`Amount (${currency.code})`]: monthTotal })
    const ws = XLSX.utils.json_to_sheet(data)
    ws['!cols'] = [{ wch: 12 }, { wch: 28 }, { wch: 14 }, { wch: 16 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, labelFor(month))
    XLSX.writeFile(wb, `expenses-${month}.xlsx`)
  }

  function downloadBlob(blob, filename) {
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: filename })
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="app" data-theme={theme}>
      <header className="app-header">
        <div className="header-brand">
          <img src={heroImg} className="header-logo" alt="" width="28" height="30" />
          <span className="header-title">Expense Tracker</span>
        </div>
        <div className="header-actions">
          <button
            className="icon-btn"
            onClick={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
          <select
            className="currency-select"
            value={currencyCode}
            onChange={e => setCurrencyCode(e.target.value)}
            aria-label="Currency"
          >
            {CURRENCIES.map(c => (
              <option key={c.code} value={c.code}>{c.code} — {c.symbol}</option>
            ))}
          </select>
        </div>
      </header>

      <main className="app-main">
        {/* Month navigation */}
        <div className="month-nav">
          <button className="icon-btn" onClick={() => setMonth(m => shiftMonth(m, -1))} aria-label="Previous month">‹</button>
          <span className="month-label">{labelFor(month)}</span>
          <button className="icon-btn" onClick={() => setMonth(m => shiftMonth(m, 1))} aria-label="Next month">›</button>
          {month !== thisYearMonth() && (
            <button className="today-btn" onClick={() => setMonth(thisYearMonth())}>Today</button>
          )}
        </div>

        {/* Monthly total + budget */}
        <section className="card total-card">
          <div className="total-top">
            <div>
              <div className="total-label">Total spent</div>
              <div className={`total-amount${over ? ' over' : ''}`}>{fmt(currency.symbol, monthTotal)}</div>
            </div>
            <label className="budget-input">
              <span>Monthly budget</span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="none"
                value={budget}
                onChange={e => setBudget(e.target.value)}
              />
            </label>
          </div>
          {budgetNum > 0 && (
            <div className="budget-bar-wrap">
              <div className="budget-bar">
                <div className={`budget-fill${over ? ' over' : ''}`} style={{ width: `${pct}%` }} />
              </div>
              <div className={`budget-note${over ? ' over' : ''}`}>
                {over
                  ? `Over budget by ${fmt(currency.symbol, monthTotal - budgetNum)}`
                  : `${fmt(currency.symbol, budgetNum - monthTotal)} left of ${fmt(currency.symbol, budgetNum)}`}
              </div>
            </div>
          )}
        </section>

        {/* Add / edit form */}
        <section className="card">
          <h2 className="section-title">{editingId ? 'Edit Expense' : 'Add Expense'}</h2>
          <form className="expense-form" onSubmit={submitForm}>
            <div className="form-row">
              <label className="form-label">
                Date
                <input type="date" name="date" className="form-input" value={form.date} onChange={onChange} required />
              </label>
              <label className="form-label">
                Category
                <select name="category" className="form-input form-select" value={form.category} onChange={onChange}>
                  {CATEGORIES.map(cat => <option key={cat}>{cat}</option>)}
                </select>
              </label>
              <label className="form-label">
                Amount
                <input type="number" name="amount" className="form-input" value={form.amount} onChange={onChange} placeholder="0.00" min="0.01" step="0.01" required />
              </label>
              <label className="form-label form-label--wide">
                Description
                <input type="text" name="description" className="form-input" value={form.description} onChange={onChange} placeholder="e.g. Groceries" required />
              </label>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-add">{editingId ? 'Update Expense' : 'Add Expense'}</button>
              {editingId && <button type="button" className="btn-ghost" onClick={cancelEdit}>Cancel</button>}
            </div>
          </form>
        </section>

        <div className="two-col">
          {/* Expense list */}
          <section className="card">
            <div className="list-head">
              <h2 className="section-title">Expenses</h2>
              <div className="list-filters">
                <input
                  type="search"
                  className="form-input search-input"
                  placeholder="Search…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <select className="form-input form-select" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                  <option>All</option>
                  {CATEGORIES.map(cat => <option key={cat}>{cat}</option>)}
                </select>
              </div>
            </div>
            {visibleExpenses.length === 0
              ? <p className="empty">{monthExpenses.length === 0 ? 'No expenses this month.' : 'No matches.'}</p>
              : (
                <ul className="expense-list">
                  {visibleExpenses.map(e => (
                    <li key={e.id} className="expense-item">
                      <span className="cat-dot" style={{ background: CATEGORY_COLORS[e.category] }} />
                      <span className="expense-desc">{e.description}</span>
                      <span className="expense-cat">{e.category}</span>
                      <span className="expense-date">{e.date.slice(5)}</span>
                      <span className="expense-amount">{fmt(currency.symbol, e.amount)}</span>
                      <span className="row-actions">
                        <button className="btn-icon" onClick={() => startEdit(e)} aria-label="Edit expense" title="Edit">✎</button>
                        <button className="btn-icon danger" onClick={() => deleteExpense(e.id)} aria-label="Delete expense" title="Delete">×</button>
                      </span>
                    </li>
                  ))}
                </ul>
              )
            }
          </section>

          {/* Spending chart */}
          <section className="card">
            <h2 className="section-title">Spending by Category</h2>
            {byCategory.length === 0
              ? <p className="empty">No data yet.</p>
              : (
                <div className="chart-wrap">
                  <Donut data={byCategory} total={monthTotal} symbol={currency.symbol} />
                  <ul className="legend">
                    {byCategory.map(({ cat, total }) => (
                      <li key={cat} className="legend-item">
                        <span className="legend-dot" style={{ background: CATEGORY_COLORS[cat] }} />
                        <span className="legend-cat">{cat}</span>
                        <span className="legend-amt">{fmt(currency.symbol, total)}</span>
                        <span className="legend-pct">{Math.round((total / monthTotal) * 100)}%</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            }
          </section>
        </div>

        <div className="export-row">
          <button className="btn-export" onClick={exportCSV}>Export CSV</button>
          <button className="btn-export primary" onClick={exportExcel}>Export Excel</button>
        </div>
      </main>
    </div>
  )
}

function Donut({ data, total, symbol }) {
  const size = 160
  const stroke = 26
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  let acc = 0
  return (
    <svg className="donut" width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Spending by category">
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--track)" strokeWidth={stroke} />
        {data.map(({ cat, total: t }) => {
          const frac = t / total
          const seg = (
            <circle
              key={cat}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={CATEGORY_COLORS[cat]}
              strokeWidth={stroke}
              strokeDasharray={`${frac * c} ${c}`}
              strokeDashoffset={-acc * c}
            />
          )
          acc += frac
          return seg
        })}
      </g>
      <text x="50%" y="47%" className="donut-total" textAnchor="middle" dominantBaseline="middle">
        {fmt(symbol, total)}
      </text>
      <text x="50%" y="60%" className="donut-sub" textAnchor="middle" dominantBaseline="middle">this month</text>
    </svg>
  )
}
