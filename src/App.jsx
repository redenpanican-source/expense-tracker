import { useState, useEffect } from 'react'
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

const LS_EXPENSES = 'expense-logger-expenses'
const LS_CURRENCY = 'expense-logger-currency'

function fmt(symbol, amount) {
  return `${symbol}${Number(amount).toLocaleString('en', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function thisYearMonth() {
  return new Date().toISOString().slice(0, 7)
}

function monthLabel() {
  return new Date().toLocaleDateString('en', { month: 'long', year: 'numeric' })
}

export default function App() {
  const [expenses, setExpenses] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_EXPENSES)) ?? [] }
    catch { return [] }
  })

  const [currencyCode, setCurrencyCode] = useState(
    () => localStorage.getItem(LS_CURRENCY) ?? 'PHP'
  )

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    description: '',
    amount: '',
    category: 'Food',
  })

  const currency = CURRENCIES.find(c => c.code === currencyCode) ?? CURRENCIES[0]

  useEffect(() => {
    localStorage.setItem(LS_EXPENSES, JSON.stringify(expenses))
  }, [expenses])

  useEffect(() => {
    localStorage.setItem(LS_CURRENCY, currencyCode)
  }, [currencyCode])

  function onChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  function addExpense(e) {
    e.preventDefault()
    const amt = parseFloat(form.amount)
    if (!form.description.trim() || !amt || amt <= 0) return
    const entry = {
      id: crypto.randomUUID(),
      date: form.date,
      description: form.description.trim(),
      amount: amt,
      category: form.category,
    }
    setExpenses(prev =>
      [entry, ...prev].sort((a, b) => b.date.localeCompare(a.date))
    )
    setForm(f => ({ ...f, description: '', amount: '' }))
  }

  function deleteExpense(id) {
    setExpenses(prev => prev.filter(e => e.id !== id))
  }

  const ym = thisYearMonth()
  const monthlyTotal = expenses
    .filter(e => e.date.startsWith(ym))
    .reduce((sum, e) => sum + e.amount, 0)

  const byCategory = CATEGORIES
    .map(cat => ({
      cat,
      total: expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0),
    }))
    .filter(c => c.total > 0)
    .sort((a, b) => b.total - a.total)

  function exportCSV() {
    const header = ['Date', 'Description', 'Category', `Amount (${currency.code})`]
    const rows = expenses.map(e => [e.date, e.description, e.category, e.amount.toFixed(2)])
    const csv = [header, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
      download: `expenses-${currency.code}.csv`,
    })
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-brand">
          <img src={heroImg} className="header-logo" alt="" width="28" height="30" />
          <span className="header-title">Expense Tracker</span>
        </div>
        <div className="currency-selector">
          <label htmlFor="currency-select" className="currency-label">Currency</label>
          <select
            id="currency-select"
            className="currency-select"
            value={currencyCode}
            onChange={e => setCurrencyCode(e.target.value)}
          >
            {CURRENCIES.map(c => (
              <option key={c.code} value={c.code}>{c.code} — {c.symbol}</option>
            ))}
          </select>
        </div>
      </header>

      <main className="app-main">
        <section className="card monthly-total">
          <div className="monthly-label">{monthLabel()} Total</div>
          <div className="monthly-amount">{fmt(currency.symbol, monthlyTotal)}</div>
        </section>

        <section className="card">
          <h2 className="section-title">Add Expense</h2>
          <form className="expense-form" onSubmit={addExpense}>
            <div className="form-row">
              <label className="form-label">
                Date
                <input
                  type="date"
                  name="date"
                  className="form-input"
                  value={form.date}
                  onChange={onChange}
                  required
                />
              </label>
              <label className="form-label">
                Category
                <select
                  name="category"
                  className="form-input form-select"
                  value={form.category}
                  onChange={onChange}
                >
                  {CATEGORIES.map(cat => <option key={cat}>{cat}</option>)}
                </select>
              </label>
              <label className="form-label">
                Amount
                <input
                  type="number"
                  name="amount"
                  className="form-input"
                  value={form.amount}
                  onChange={onChange}
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  required
                />
              </label>
              <label className="form-label form-label--wide">
                Description
                <input
                  type="text"
                  name="description"
                  className="form-input"
                  value={form.description}
                  onChange={onChange}
                  placeholder="e.g. Groceries"
                  required
                />
              </label>
            </div>
            <button type="submit" className="btn-add">Add Expense</button>
          </form>
        </section>

        <div className="two-col">
          <section className="card">
            <h2 className="section-title">Expenses</h2>
            {expenses.length === 0
              ? <p className="empty">No expenses yet.</p>
              : (
                <ul className="expense-list">
                  {expenses.map(e => (
                    <li key={e.id} className="expense-item">
                      <span className="expense-date">{e.date}</span>
                      <span className="expense-desc">{e.description}</span>
                      <span className="expense-cat">{e.category}</span>
                      <span className="expense-amount">{fmt(currency.symbol, e.amount)}</span>
                      <button
                        className="btn-delete"
                        onClick={() => deleteExpense(e.id)}
                        aria-label="Delete expense"
                      >×</button>
                    </li>
                  ))}
                </ul>
              )
            }
          </section>

          <section className="card">
            <h2 className="section-title">By Category</h2>
            {byCategory.length === 0
              ? <p className="empty">No data yet.</p>
              : (
                <ul className="category-list">
                  {byCategory.map(({ cat, total }) => (
                    <li key={cat} className="category-item">
                      <span>{cat}</span>
                      <span className="category-amount">{fmt(currency.symbol, total)}</span>
                    </li>
                  ))}
                </ul>
              )
            }
          </section>
        </div>

        <div className="export-row">
          <button className="btn-export" onClick={exportCSV}>
            Export CSV ({currency.code})
          </button>
        </div>
      </main>
    </div>
  )
}
