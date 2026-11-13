// CrewBook Calendar: month view, green = fully staffed, red = needs crew, grey = past / no roles.
import React, { useMemo, useState } from 'react'
import { eventNeeded, eventStaffingState, eventUnfilled, fmtDateShort, parseISO, toISO } from '../lib'
import { useApp } from '../store'
import { Chip } from '../ui'

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function Calendar() {
  const { db, go } = useApp()
  const now = new Date()
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() })

  const cells = useMemo(() => {
    const first = new Date(ym.y, ym.m, 1)
    const startDow = first.getDay()
    const daysInMonth = new Date(ym.y, ym.m + 1, 0).getDate()
    const out: { date: string; inMonth: boolean }[] = []
    for (let i = 0; i < startDow; i++) {
      const d = new Date(ym.y, ym.m, 1 - (startDow - i))
      out.push({ date: toISO(d), inMonth: false })
    }
    for (let d = 1; d <= daysInMonth; d++) {
      out.push({ date: toISO(new Date(ym.y, ym.m, d)), inMonth: true })
    }
    while (out.length % 7 !== 0) {
      const last = parseISO(out[out.length - 1].date)
      last.setDate(last.getDate() + 1)
      out.push({ date: toISO(last), inMonth: false })
    }
    return out
  }, [ym])

  const byDate = useMemo(() => {
    const map = new Map<string, typeof db.events>()
    for (const ev of db.events) {
      const list = map.get(ev.date) ?? []
      list.push(ev)
      map.set(ev.date, list)
    }
    return map
  }, [db.events])

  const title = new Date(ym.y, ym.m, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const today = toISO(new Date())

  const shift = (n: number) => {
    const d = new Date(ym.y, ym.m + n, 1)
    setYm({ y: d.getFullYear(), m: d.getMonth() })
  }

  return (
    <div>
      <div className="page-head">
        <h1>Calendar</h1>
        <span style={{ marginLeft: 'auto' }} className="row">
          <button className="btn btn-small" onClick={() => shift(-1)}>
            ← Prev
          </button>
          <strong style={{ minWidth: 130, textAlign: 'center' }}>{title}</strong>
          <button className="btn btn-small" onClick={() => shift(1)}>
            Next →
          </button>
          <button className="btn btn-small" onClick={() => setYm({ y: now.getFullYear(), m: now.getMonth() })}>
            Today
          </button>
        </span>
      </div>

      <div className="card">
        <div className="cal-grid">
          {DOW.map((d) => (
            <div key={d} className="cal-dow">
              {d}
            </div>
          ))}
          {cells.map(({ date, inMonth }) => {
            const events = byDate.get(date) ?? []
            return (
              <div key={date} className={`cal-day ${inMonth ? '' : 'other-month'} ${date === today ? 'today' : ''}`}>
                <span className="cal-num">{parseISO(date).getDate()}</span>
                {events.map((ev) => {
                  const state = eventStaffingState(db, ev)
                  const open = eventUnfilled(db, ev)
                  return (
                    <button
                      key={ev.id}
                      className={`cal-event ${state}`}
                      onClick={() => go('events', { kind: 'event', id: ev.id })}
                      title={`${ev.title} — ${fmtDateShort(ev.date)}`}
                    >
                      {state === 'staffed' ? '✓ ' : ''}
                      {ev.title}
                      {state === 'needs' ? ` (${open} open)` : ''}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
        <div className="legend">
          <span>
            <span className="legend-dot" style={{ background: '#15803d' }} />
            Fully staffed
          </span>
          <span>
            <span className="legend-dot" style={{ background: '#b91c1c' }} />
            Still needs staffing
          </span>
          <span>
            <span className="legend-dot" style={{ background: '#94a3b8' }} />
            Completed / no roles
          </span>
        </div>
      </div>

      <div className="card">
        <h2>This month at a glance</h2>
        {db.events.filter((e) => e.date.startsWith(`${ym.y}-${String(ym.m + 1).padStart(2, '0')}`)).length === 0 ? (
          <p className="muted">No events this month.</p>
        ) : (
          db.events
            .filter((e) => e.date.startsWith(`${ym.y}-${String(ym.m + 1).padStart(2, '0')}`))
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((ev) => (
              <div key={ev.id} className="list-row clickable" onClick={() => go('events', { kind: 'event', id: ev.id })}>
                <div className="list-main">
                  <div className="list-title">{ev.title}</div>
                  <div className="list-sub">
                    {fmtDateShort(ev.date)} · {ev.venue || 'No venue yet'}
                  </div>
                </div>
                {eventNeeded(db, ev) > 0 && eventUnfilled(db, ev) > 0 ? (
                  <Chip>
                    <span className="chip-red" style={{ background: 'none', padding: 0 }}>{eventUnfilled(db, ev)} open</span>
                  </Chip>
                ) : (
                  <span className="chip chip-green">✓ Staffed</span>
                )}
              </div>
            ))
        )}
      </div>
    </div>
  )
}
