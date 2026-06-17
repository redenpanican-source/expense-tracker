import { useState, useEffect, useMemo } from 'react'

const CATEGORIES = ['food', 'transport', 'groceries', 'bills', 'family', 'giving', 'business', 'personal', 'other']

const fmt = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })

const C = {
  bg: '#101713',
  surface: '#18221C',
  gold: '#C9A24B',
  text: '#E8E0D0',
  muted: '#7A9080',
  border: '#253029',
}

const CAT_COLOR = {
  food: '#E07B54',
  transport: '#5B8DB8',
  groceries: '#6BAE75',
  bills: '#C9A24B',
  family: '#D4729A',
  giving: '#7B6FCC',
  business: '#4BBAC9',
  personal: '#C96B4B',
  other: '#7A9080',
}

export default function ExpenseLogger() {
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [saveState, setSaveState] = useState('idle')
  const [month, setMonth] = useState(currentMonth)
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('food')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(todayStr)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    try {
      const stored = window.storage?.getItem?.('expenses')
      if (stored) setExpenses(JSON.parse(stored))
    } catch (_) {}
    setLoading(false)
  }, [])

  function persist(next) {
    try {
      setSaveState('saving')
      window.storage?.setItem?.('expenses', JSON.stringify(next))
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 1500)
    } catch (_) {
      setSaveState('idle')
    }
  }

  function addExpense() {
    const parsed = parseFloat(amount)
    if (!amount || isNaN(parsed) || parsed <= 0) {
      setFormError('Enter a valid amount.')
      return
    }
    if (!date) {
      setFormError('Select a date.')
      return
    }
    setFormError('')
    const next = [
      ...expenses,
      { id: crypto.randomUUID(), amount: parsed, category, note: note.trim(), date },
    ]
    setExpenses(next)
    persist(next)
    setAmount('')
    setNote('')
    setDate(todayStr)
    setCategory('food')
  }

  function deleteExpense(id) {
    const next = expenses.filter(e => e.id !== id)
    setExpenses(next)
    persist(next)
  }

  function exportCSV() {
    const rows = [
      ['Date', 'Category', 'Amount', 'Note'],
      ...monthExpenses.map(e => [e.date, e.category, e.amount, e.note]),
    ]
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `expenses-${month}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function prevMonth() {
    const [y, m] = month.split('-').map(Number)
    const d = new Date(y, m - 2, 1)
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  function nextMonth() {
    const [y, m] = month.split('-').map(Number)
    const d = new Date(y, m, 1)
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const monthExpenses = useMemo(
    () => expenses.filter(e => e.date.startsWith(month)),
    [expenses, month]
  )

  const monthTotal = useMemo(
    () => monthExpenses.reduce((sum, e) => sum + e.amount, 0),
    [monthExpenses]
  )

  const byCategory = useMemo(() => {
    const map = {}
    for (const e of monthExpenses) map[e.category] = (map[e.category] || 0) + e.amount
    return map
  }, [monthExpenses])

  const byDay = useMemo(() => {
    const map = {}
    for (const e of monthExpenses) {
      if (!map[e.date]) map[e.date] = []
      map[e.date].push(e)
    }
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a))
  }, [monthExpenses])

  const monthLabel = new Date(`${month}-15`).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const s = {
    root: {
      minHeight: '100vh',
      background: C.bg,
      color: C.text,
      fontFamily: "'Sora', sans-serif",
      paddingBottom: '80px',
    },
    header: {
      background: C.surface,
      borderBottom: `1px solid ${C.border}`,
      padding: '16px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 10,
    },
    brand: {
      fontFamily: "'Fraunces', serif",
      fontSize: '22px',
      fontWeight: 700,
      color: C.gold,
      letterSpacing: '0.01em',
    },
    saveIndicator: {
      fontSize: '12px',
      color: C.muted,
      fontFamily: "'Spline Sans Mono', monospace",
      minWidth: '60px',
      textAlign: 'right',
    },
    main: {
      maxWidth: '520px',
      margin: '0 auto',
      padding: '24px 16px',
    },
    monthNav: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '20px',
    },
    navBtn: {
      background: C.surface,
      border: `1px solid ${C.border}`,
      color: C.gold,
      borderRadius: '8px',
      padding: '6px 18px',
      cursor: 'pointer',
      fontSize: '20px',
      lineHeight: 1,
      fontFamily: "'Sora', sans-serif",
    },
    monthLabelStyle: {
      fontFamily: "'Fraunces', serif",
      fontSize: '18px',
      fontWeight: 600,
      color: C.text,
    },
    totalBlock: {
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: '14px',
      padding: '20px 24px',
      marginBottom: '24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    totalLabel: {
      fontSize: '12px',
      color: C.muted,
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      marginBottom: '4px',
    },
    totalAmount: {
      fontFamily: "'Fraunces', serif",
      fontSize: '28px',
      fontWeight: 700,
      color: C.gold,
    },
    exportBtn: {
      background: 'transparent',
      border: `1px solid ${C.gold}`,
      color: C.gold,
      borderRadius: '8px',
      padding: '7px 14px',
      cursor: 'pointer',
      fontSize: '12px',
      fontFamily: "'Sora', sans-serif",
      letterSpacing: '0.03em',
    },
    formCard: {
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: '14px',
      padding: '20px',
      marginBottom: '24px',
    },
    formTitle: {
      fontFamily: "'Fraunces', serif",
      fontSize: '16px',
      color: C.gold,
      fontWeight: 600,
      marginBottom: '14px',
    },
    input: {
      width: '100%',
      background: C.bg,
      border: `1px solid ${C.border}`,
      borderRadius: '8px',
      color: C.text,
      padding: '10px 12px',
      fontSize: '15px',
      fontFamily: "'Sora', sans-serif",
      marginBottom: '12px',
      boxSizing: 'border-box',
      outline: 'none',
    },
    chips: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '6px',
      marginBottom: '12px',
    },
    row: {
      display: 'flex',
      gap: '10px',
    },
    addBtn: {
      width: '100%',
      background: C.gold,
      border: 'none',
      borderRadius: '10px',
      color: '#101713',
      padding: '12px',
      fontSize: '15px',
      fontWeight: 700,
      cursor: 'pointer',
      fontFamily: "'Sora', sans-serif",
      marginTop: '14px',
    },
    formError: {
      color: '#E07B54',
      fontSize: '13px',
      marginTop: '8px',
    },
    sectionTitle: {
      fontSize: '12px',
      color: C.muted,
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      marginBottom: '12px',
    },
    barRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '9px',
    },
    barLabel: {
      width: '88px',
      fontSize: '12px',
      color: C.text,
      textTransform: 'capitalize',
      flexShrink: 0,
    },
    barTrack: {
      flex: 1,
      height: '7px',
      background: C.bg,
      borderRadius: '4px',
      overflow: 'hidden',
    },
    barValue: {
      width: '96px',
      fontSize: '12px',
      color: C.muted,
      textAlign: 'right',
      fontFamily: "'Spline Sans Mono', monospace",
      flexShrink: 0,
    },
    dayGroup: {
      marginBottom: '18px',
    },
    dayLabel: {
      fontSize: '12px',
      color: C.muted,
      fontFamily: "'Spline Sans Mono', monospace",
      paddingBottom: '6px',
      marginBottom: '2px',
      borderBottom: `1px solid ${C.border}`,
    },
    entryRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '9px 0',
      borderBottom: `1px solid ${C.border}33`,
    },
    entryLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    entryNote: {
      fontSize: '14px',
      color: C.text,
    },
    entryCat: {
      fontSize: '11px',
      color: C.muted,
      textTransform: 'capitalize',
    },
    entryAmount: {
      fontSize: '14px',
      fontFamily: "'Spline Sans Mono', monospace",
      color: C.gold,
    },
    deleteBtn: {
      background: 'transparent',
      border: 'none',
      color: C.muted,
      cursor: 'pointer',
      fontSize: '18px',
      padding: '0 4px',
      lineHeight: 1,
      display: 'flex',
      alignItems: 'center',
    },
    empty: {
      textAlign: 'center',
      color: C.muted,
      fontSize: '14px',
      padding: '32px 0',
    },
    footer: {
      textAlign: 'center',
      fontSize: '11px',
      color: C.muted,
      fontFamily: "'Spline Sans Mono', monospace",
      marginTop: '32px',
      letterSpacing: '0.05em',
    },
  }

  if (loading) {
    return (
      <div style={{ ...s.root, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: C.muted, fontFamily: "'Sora', sans-serif" }}>Loading…</span>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Sora:wght@400;600;700&family=Spline+Sans+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; background: #101713; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.4) sepia(1) hue-rotate(60deg); cursor: pointer; }
        input::placeholder { color: #7A9080; }
        input:focus { border-color: #C9A24B88 !important; }
        button:active { opacity: 0.8; }
      `}</style>

      <div style={s.root}>
        <header style={s.header}>
          <span style={s.brand}>Expense Tracker</span>
          <span style={s.saveIndicator}>
            {saveState === 'saving' ? 'saving…' : saveState === 'saved' ? 'saved ✓' : ''}
          </span>
        </header>

        <main style={s.main}>
          <div style={s.monthNav}>
            <button style={s.navBtn} onClick={prevMonth}>‹</button>
            <span style={s.monthLabelStyle}>{monthLabel}</span>
            <button style={s.navBtn} onClick={nextMonth}>›</button>
          </div>

          <div style={s.totalBlock}>
            <div>
              <div style={s.totalLabel}>Month Total</div>
              <div style={s.totalAmount}>{fmt.format(monthTotal)}</div>
            </div>
            <button style={s.exportBtn} onClick={exportCSV}>Export CSV</button>
          </div>

          <div style={s.formCard}>
            <div style={s.formTitle}>Log Expense</div>
            <input
              style={s.input}
              type="number"
              min="0"
              step="0.01"
              placeholder="Amount (PHP)"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addExpense()}
            />
            <div style={s.chips}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    border: `1px solid ${category === cat ? CAT_COLOR[cat] : C.border}`,
                    background: category === cat ? `${CAT_COLOR[cat]}22` : 'transparent',
                    color: category === cat ? CAT_COLOR[cat] : C.muted,
                    fontFamily: "'Sora', sans-serif",
                    transition: 'all 0.15s',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div style={s.row}>
              <input
                style={{ ...s.input, marginBottom: 0, flex: 1 }}
                type="text"
                placeholder="Note (optional)"
                value={note}
                onChange={e => setNote(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addExpense()}
              />
              <input
                style={{ ...s.input, marginBottom: 0, width: '148px', flexShrink: 0 }}
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
            {formError && <div style={s.formError}>{formError}</div>}
            <button style={s.addBtn} onClick={addExpense}>+ Add Expense</button>
          </div>

          {Object.keys(byCategory).length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <div style={s.sectionTitle}>By Category</div>
              {CATEGORIES.filter(cat => byCategory[cat]).map(cat => (
                <div key={cat} style={s.barRow}>
                  <div style={s.barLabel}>{cat}</div>
                  <div style={s.barTrack}>
                    <div
                      style={{
                        height: '100%',
                        width: `${(byCategory[cat] / monthTotal) * 100}%`,
                        background: CAT_COLOR[cat],
                        borderRadius: '4px',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                  <div style={s.barValue}>{fmt.format(byCategory[cat])}</div>
                </div>
              ))}
            </div>
          )}

          <div>
            <div style={s.sectionTitle}>Entries</div>
            {byDay.length === 0 ? (
              <div style={s.empty}>No expenses this month.</div>
            ) : (
              byDay.map(([day, entries]) => (
                <div key={day} style={s.dayGroup}>
                  <div style={s.dayLabel}>
                    {new Date(`${day}T12:00:00`).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                  {entries.map(entry => (
                    <div key={entry.id} style={s.entryRow}>
                      <div style={s.entryLeft}>
                        <div
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: CAT_COLOR[entry.category] || C.muted,
                            flexShrink: 0,
                          }}
                        />
                        <div>
                          {entry.note ? (
                            <>
                              <div style={s.entryNote}>{entry.note}</div>
                              <div style={s.entryCat}>{entry.category}</div>
                            </>
                          ) : (
                            <div style={{ ...s.entryNote, color: C.muted, fontStyle: 'italic' }}>
                              {entry.category}
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={s.entryAmount}>{fmt.format(entry.amount)}</span>
                        <button
                          style={s.deleteBtn}
                          onClick={() => deleteExpense(entry.id)}
                          title="Delete"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>

          <div style={s.footer}>Expense Tracker · {new Date().getFullYear()}</div>
        </main>
      </div>
    </>
  )
}
