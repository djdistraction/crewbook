// CrewBook Board (dashboard).
import React, { useMemo, useRef, useState } from 'react'
import {
  DB,
  Period,
  downloadFile,
  eventFilled,
  eventIsPast,
  eventNeeded,
  eventUnfilled,
  fmtDate,
  fmtDateShort,
  inPeriod,
  money,
  periodLabel,
  todayISO,
} from '../lib'
import { sampleDB } from '../sampleData'
import { useApp, DrillKind } from '../store'
import { Avatar, ConfirmDialog, EmptyState, Modal } from '../ui'

function upcomingEvents(db: DB, period: Period) {
  return db.events
    .filter((e) => e.date >= todayISO() && inPeriod(e.date, period))
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
}

function unfilledEvents(db: DB, period: Period) {
  return db.events
    .filter((e) => e.date >= todayISO() && inPeriod(e.date, period) && eventUnfilled(db, e) > 0)
    .sort((a, b) => a.date.localeCompare(b.date))
}

function workingThisPeriod(db: DB, period: Period) {
  const map = new Map<string, { personId?: string; groupId?: string; count: number }>()
  for (const a of db.assignments) {
    const ev = db.events.find((e) => e.id === a.eventId)
    if (!ev || !inPeriod(ev.date, period)) continue
    const key = a.personId ? `p:${a.personId}` : `g:${a.groupId}`
    const cur = map.get(key) ?? { personId: a.personId, groupId: a.groupId, count: 0 }
    cur.count++
    map.set(key, cur)
  }
  return [...map.values()]
}

function awaitingPayment(db: DB, period: Period) {
  return db.assignments
    .filter((a) => {
      if (a.paid) return false
      const ev = db.events.find((e) => e.id === a.eventId)
      return ev && inPeriod(ev.date, period)
    })
    .sort((a, b) => {
      const ea = db.events.find((e) => e.id === a.eventId)
      const eb = db.events.find((e) => e.id === b.eventId)
      return (ea?.date ?? '').localeCompare(eb?.date ?? '')
    })
}

export function Board() {
  const { db, update, replace, go } = useApp()
  const [period, setPeriod] = useState<Period>('week')
  const [drill, setDrill] = useState<DrillKind | null>(null)
  const [confirmErase, setConfirmErase] = useState(false)
  const [restoreMsg, setRestoreMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const upcoming = useMemo(() => upcomingEvents(db, period), [db, period])
  const unfilled = useMemo(() => unfilledEvents(db, period), [db, period])
  const working = useMemo(() => workingThisPeriod(db, period), [db, period])
  const awaiting = useMemo(() => awaitingPayment(db, period), [db, period])

  const loadSamples = () => {
    if (db.seeded || db.people.length > 0 || db.events.length > 0) return
    replace(sampleDB())
  }

  const clearSamples = () => {
    replace({ ...db, people: [], groups: [], contacts: [], events: [], assignments: [], series: [], invoices: [], seeded: false })
  }

  const eraseAll = () => {
    const company = db.company
    replace({
      ...db,
      people: [],
      groups: [],
      contacts: [],
      events: [],
      assignments: [],
      series: [],
      invoices: [],
      qualifications: [...db.qualifications],
      nextInvoice: 1001,
      seeded: false,
      company,
    })
    setConfirmErase(false)
  }

  const downloadBackup = () => {
    const stamp = todayISO()
    downloadFile(`crewbook-backup-${stamp}.json`, JSON.stringify(db, null, 2))
  }

  const onRestoreFile = (f: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as DB
        if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.people) || !Array.isArray(parsed.events)) {
          setRestoreMsg('That file is not a CrewBook backup.')
          return
        }
        setPendingRestore(parsed)
        setRestoreMsg('')
      } catch {
        setRestoreMsg('That file is not a CrewBook backup.')
      }
    }
    reader.readAsText(f)
  }

  const [pendingRestore, setPendingRestore] = useState<DB | null>(null)

  const stats: { kind: DrillKind; label: string; num: number }[] = [
    { kind: 'upcoming', label: 'Upcoming events', num: upcoming.length },
    { kind: 'unfilled', label: 'Unfilled spots', num: unfilled.reduce((s, e) => s + eventUnfilled(db, e), 0) },
    { kind: 'working', label: 'Working', num: working.length },
    { kind: 'awaiting', label: 'Awaiting payment', num: awaiting.length },
  ]

  return (
    <div>
      <div className="page-head">
        <h1>Board</h1>
        <p>Everything happening {periodLabel(period)}.</p>
        <span style={{ marginLeft: 'auto' }}>
          <span className="period-filter" role="group" aria-label="Time period">
            {(['week', 'month', 'year', 'all'] as Period[]).map((p) => (
              <button key={p} className={period === p ? 'active' : ''} onClick={() => setPeriod(p)}>
                {p === 'week' ? 'This week' : p === 'month' ? 'This month' : p === 'year' ? 'This year' : 'All time'}
              </button>
            ))}
          </span>
        </span>
      </div>

      <div className="grid-4" style={{ marginBottom: 16 }}>
        {stats.map((s) => (
          <button key={s.kind} className="stat-card" onClick={() => setDrill(s.kind)}>
            <div className="stat-num">{s.num}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-period">· {periodLabel(period)}</div>
          </button>
        ))}
      </div>

      {drill && (
        <DrillView
          drill={drill}
          period={period}
          onClose={() => setDrill(null)}
        />
      )}

      <div className="grid-2">
        <div className="card">
          <h2>Upcoming events</h2>
          {upcoming.length === 0 ? (
            <EmptyState>No upcoming events {periodLabel(period)}.</EmptyState>
          ) : (
            upcoming.slice(0, 6).map((ev) => (
              <div key={ev.id} className="list-row clickable" onClick={() => go('events', { kind: 'event', id: ev.id })}>
                <div className="list-main">
                  <div className="list-title">{ev.title}</div>
                  <div className="list-sub">
                    {fmtDate(ev.date)} · {ev.venue || 'No venue yet'}
                  </div>
                </div>
                <span className={eventUnfilled(db, ev) > 0 ? 'chip chip-red' : 'chip chip-green'}>
                  {eventUnfilled(db, ev) > 0
                    ? `${eventUnfilled(db, ev)} open`
                    : '✓ Staffed'}
                </span>
              </div>
            ))
          )}
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn btn-small" onClick={() => go('events')}>
              All events
            </button>
            <button className="btn btn-small btn-primary" onClick={() => go('events', { kind: 'event', id: 'new' })}>
              New event
            </button>
          </div>
        </div>

        <div className="card">
          <h2>Awaiting payment</h2>
          {awaiting.length === 0 ? (
            <EmptyState>Nothing owed {periodLabel(period)}.</EmptyState>
          ) : (
            awaiting.slice(0, 8).map((a) => {
              const ev = db.events.find((e) => e.id === a.eventId)
              const person = a.personId ? db.people.find((p) => p.id === a.personId) : undefined
              const group = a.groupId ? db.groups.find((g) => g.id === a.groupId) : undefined
              const name = person?.name ?? group?.name ?? 'Unknown'
              return (
                <div key={a.id} className="list-row">
                  <Avatar name={name} photo={person?.photo ?? group?.photo} size={34} />
                  <div className="list-main">
                    <div className="list-title">{name}</div>
                    <div className="list-sub">
                      {ev ? `${ev.title} · ${fmtDateShort(ev.date)}` : ''} · {a.qualification}
                    </div>
                  </div>
                  <span className="money">{money(a.payCents)}</span>
                  <button
                    className="btn btn-small btn-primary"
                    onClick={() => update((d) => {
                      const x = d.assignments.find((z) => z.id === a.id)
                      if (x) x.paid = true
                    })}
                  >
                    Mark paid
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>

      <div className="card">
        <h2>Your data</h2>
        <div className="row">
          <button className="btn" onClick={downloadBackup}>
            Download backup
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            Restore from backup
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onRestoreFile(f)
              e.target.value = ''
            }}
          />
          {db.people.length === 0 && db.events.length === 0 && (
            <button className="btn" onClick={loadSamples}>
              Load sample data
            </button>
          )}
          {db.seeded && (
            <button className="btn" onClick={clearSamples}>
              Clear sample data
            </button>
          )}
          <button className="btn btn-danger" onClick={() => setConfirmErase(true)}>
            Erase everything &amp; start over
          </button>
        </div>
        {restoreMsg && <p className="negative" style={{ marginBottom: 0 }}>{restoreMsg}</p>}
        <p className="muted small" style={{ marginBottom: 0 }}>
          A backup holds your whole book — crew, groups, events, contacts, invoices, settings, and photos. Restoring replaces everything currently in the book.
        </p>
      </div>

      {confirmErase && (
        <ConfirmDialog
          title="Erase everything?"
          body="This removes all crew, groups, events, contacts, invoices, and qualifications. Your company profile and logo are kept. This cannot be undone — download a backup first if you need one."
          confirmLabel="Erase everything"
          onCancel={() => setConfirmErase(false)}
          onConfirm={eraseAll}
        />
      )}

      {pendingRestore && (
        <Modal title="Restore this backup?" onClose={() => setPendingRestore(null)}>
          <p>
            This backup contains {pendingRestore.people.length} crew, {pendingRestore.groups.length} groups,{' '}
            {pendingRestore.events.length} events, {pendingRestore.contacts.length} contacts, and{' '}
            {pendingRestore.invoices.length} invoices. Restoring replaces everything currently in the book, and it
            cannot be undone.
          </p>
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <button className="btn" onClick={() => setPendingRestore(null)}>
              Cancel
            </button>
            <button
              className="btn btn-danger"
              onClick={() => {
                replace(pendingRestore)
                setPendingRestore(null)
              }}
            >
              Restore backup
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function DrillView({ drill, period, onClose }: { drill: DrillKind; period: Period; onClose: () => void }) {
  const { db, go, update } = useApp()
  const upcoming = useMemo(() => upcomingEvents(db, period), [db, period])
  const unfilled = useMemo(() => unfilledEvents(db, period), [db, period])
  const working = useMemo(() => workingThisPeriod(db, period), [db, period])
  const awaiting = useMemo(() => awaitingPayment(db, period), [db, period])

  const title =
    drill === 'upcoming'
      ? `Upcoming events · ${periodLabel(period)}`
      : drill === 'unfilled'
        ? `Unfilled spots · ${periodLabel(period)}`
        : drill === 'working'
          ? `Working · ${periodLabel(period)}`
          : `Awaiting payment · ${periodLabel(period)}`

  return (
    <Modal title={title} onClose={onClose}>
      {drill === 'upcoming' &&
        (upcoming.length === 0 ? (
          <EmptyState>No upcoming events {periodLabel(period)}.</EmptyState>
        ) : (
          upcoming.map((ev) => (
            <div key={ev.id} className="list-row clickable" onClick={() => { onClose(); go('events', { kind: 'event', id: ev.id }) }}>
              <div className="list-main">
                <div className="list-title">{ev.title}</div>
                <div className="list-sub">
                  {fmtDate(ev.date)} · {ev.venue || 'No venue yet'} · {eventFilled(db, ev)}/{eventNeeded(db, ev)} filled
                </div>
              </div>
              <span className="money">{money(ev.invoiceAmountCents)}</span>
            </div>
          ))
        ))}
      {drill === 'unfilled' &&
        (unfilled.length === 0 ? (
          <EmptyState>Every event is fully staffed {periodLabel(period)}.</EmptyState>
        ) : (
          unfilled.map((ev) => (
            <div key={ev.id} className="list-row clickable" onClick={() => { onClose(); go('events', { kind: 'event', id: ev.id }) }}>
              <div className="list-main">
                <div className="list-title">{ev.title}</div>
                <div className="list-sub">
                  {fmtDate(ev.date)} · {ev.venue || 'No venue yet'}
                </div>
              </div>
              <span className="chip chip-red">{eventUnfilled(db, ev)} open</span>
            </div>
          ))
        ))}
      {drill === 'working' &&
        (working.length === 0 ? (
          <EmptyState>No one is working {periodLabel(period)}.</EmptyState>
        ) : (
          working.map((w) => {
            const person = w.personId ? db.people.find((p) => p.id === w.personId) : undefined
            const group = w.groupId ? db.groups.find((g) => g.id === w.groupId) : undefined
            const name = person?.name ?? group?.name ?? 'Unknown'
            return (
              <div
                key={w.personId ?? w.groupId}
                className="list-row clickable"
                onClick={() => {
                  onClose()
                  if (person) go('crew', { kind: 'person', id: person.id })
                  else if (group) go('groups', { kind: 'group', id: group.id })
                }}
              >
                <Avatar name={name} photo={person?.photo ?? group?.photo} size={34} />
                <div className="list-main">
                  <div className="list-title">{name}</div>
                  <div className="list-sub">{group ? 'Group' : person?.qualifications.join(', ')}</div>
                </div>
                <span className="chip">{w.count} {w.count === 1 ? 'gig' : 'gigs'}</span>
              </div>
            )
          })
        ))}
      {drill === 'awaiting' &&
        (awaiting.length === 0 ? (
          <EmptyState>Nothing owed {periodLabel(period)}.</EmptyState>
        ) : (
          awaiting.map((a) => {
            const ev = db.events.find((e) => e.id === a.eventId)
            const person = a.personId ? db.people.find((p) => p.id === a.personId) : undefined
            const group = a.groupId ? db.groups.find((g) => g.id === a.groupId) : undefined
            const name = person?.name ?? group?.name ?? 'Unknown'
            return (
              <div key={a.id} className="list-row">
                <Avatar name={name} photo={person?.photo ?? group?.photo} size={34} />
                <div className="list-main">
                  <div className="list-title">{name}</div>
                  <div className="list-sub">
                    {ev ? `${ev.title} · ${fmtDateShort(ev.date)}` : ''} · {a.qualification}
                  </div>
                </div>
                <span className="money">{money(a.payCents)}</span>
                <button
                  className="btn btn-small btn-primary"
                  onClick={() =>
                    update((d) => {
                      const x = d.assignments.find((z) => z.id === a.id)
                      if (x) x.paid = true
                    })
                  }
                >
                  Mark paid
                </button>
              </div>
            )
          })
        ))}
    </Modal>
  )
}
