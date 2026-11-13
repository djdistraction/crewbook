// CrewBook Events: list, create/edit with recurrence, detail with roster.
import React, { useMemo, useState } from 'react'
import {
  Assignment,
  EventItem,
  Recurrence,
  dollarsToCents,
  eventFilled,
  eventNeeded,
  eventProfit,
  eventUnfilled,
  eventWorkerPay,
  fmtDate,
  fmtTime,
  groupBookedDates,
  money,
  parseISO,
  personBookedDates,
  recurrenceDates,
  todayISO,
  toISO,
  uid,
} from '../lib'
import { useApp } from '../store'
import { Avatar, Chip, ConfirmDialog, EmptyState, Field, Modal } from '../ui'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function Events() {
  const { db, route, go } = useApp()
  const detail = route.detail

  if (detail?.kind === 'event' && detail.id === 'new') {
    return <EventForm onDone={(id) => go('events', { kind: 'event', id })} />
  }
  if (detail?.kind === 'event') {
    const ev = db.events.find((e) => e.id === detail.id)
    if (!ev) return <EmptyState>That event no longer exists.</EmptyState>
    return <EventDetail ev={ev} />
  }

  const sorted = [...db.events].sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
  const upcoming = sorted.filter((e) => e.date >= todayISO())
  const past = sorted.filter((e) => e.date < todayISO()).reverse()

  return (
    <div>
      <div className="page-head">
        <h1>Events</h1>
        <p>Every booking, past and upcoming.</p>
        <span style={{ marginLeft: 'auto' }}>
          <button className="btn btn-primary" onClick={() => go('events', { kind: 'event', id: 'new' })}>
            New event
          </button>
        </span>
      </div>
      {db.events.length === 0 ? (
        <div className="card">
          <EmptyState>No events yet. Create your first event to start staffing it.</EmptyState>
        </div>
      ) : (
        <>
          <div className="card">
            <h2>Upcoming</h2>
            {upcoming.length === 0 ? (
              <EmptyState>No upcoming events.</EmptyState>
            ) : (
              upcoming.map((ev) => <EventRow key={ev.id} ev={ev} />)
            )}
          </div>
          {past.length > 0 && (
            <div className="card">
              <h2>Past</h2>
              {past.map((ev) => <EventRow key={ev.id} ev={ev} />)}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function EventRow({ ev }: { ev: EventItem }) {
  const { db, go } = useApp()
  const unfilled = eventUnfilled(db, ev)
  const series = ev.seriesId ? db.series.find((s) => s.id === ev.seriesId) : undefined
  return (
    <div className="list-row clickable" onClick={() => go('events', { kind: 'event', id: ev.id })}>
      <div className="list-main">
        <div className="list-title">{ev.title}</div>
        <div className="list-sub">
          {fmtDate(ev.date)} · {fmtTime(ev.startTime)} – {fmtTime(ev.endTime)} · {ev.venue || 'No venue yet'}
          {series ? ` · Series: ${series.name}` : ''}
        </div>
      </div>
      {unfilled > 0 ? (
        <span className="chip chip-red">{unfilled} open</span>
      ) : (
        <span className="chip chip-green">✓ Staffed</span>
      )}
      <span className="money">{money(ev.invoiceAmountCents)}</span>
    </div>
  )
}

function EventForm({ onDone, existing }: { onDone: (id: string) => void; existing?: EventItem }) {
  const { db, update, go } = useApp()
  const [title, setTitle] = useState(existing?.title ?? '')
  const [date, setDate] = useState(existing?.date ?? todayISO())
  const [startTime, setStartTime] = useState(existing?.startTime ?? '18:00')
  const [endTime, setEndTime] = useState(existing?.endTime ?? '23:00')
  const [venue, setVenue] = useState(existing?.venue ?? '')
  const [clientType, setClientType] = useState<'Venue' | 'Individual' | 'Organization'>(existing?.clientType ?? 'Venue')
  const [contactId, setContactId] = useState(existing?.contactId ?? '')
  const [invoice, setInvoice] = useState(existing ? String(existing.invoiceAmountCents / 100) : '')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [seriesId, setSeriesId] = useState(existing?.seriesId ?? '')
  const [newSeriesName, setNewSeriesName] = useState('')
  const [roles, setRoles] = useState<{ qualification: string; count: number }[]>(
    existing?.roles.map((r) => ({ qualification: r.qualification, count: r.count })) ?? [{ qualification: 'Bartender', count: 1 }],
  )
  const [repeats, setRepeats] = useState(false)
  const [rec, setRec] = useState<Recurrence>({
    freq: 'weekly',
    interval: 1,
    weekdays: [parseISO(date).getDay()],
    endMode: 'count',
    count: 4,
    until: date,
  })

  const previewDates = useMemo(() => {
    if (!repeats || !date) return []
    return recurrenceDates(date, rec)
  }, [repeats, date, rec])

  const save = () => {
    if (!title.trim()) return
    let finalSeriesId = seriesId || undefined
    let createdId = ''
    update((d) => {
      if (newSeriesName.trim()) {
        const s = { id: uid(), name: newSeriesName.trim() }
        d.series.push(s)
        finalSeriesId = s.id
      }
      const make = (dte: string): EventItem => ({
        id: uid(),
        title: title.trim(),
        date: dte,
        startTime,
        endTime,
        venue: venue.trim(),
        clientType,
        contactId,
        invoiceAmountCents: dollarsToCents(invoice),
        seriesId: finalSeriesId,
        roles: roles
          .filter((r) => r.qualification.trim())
          .map((r) => ({ id: uid(), qualification: r.qualification.trim(), count: Math.max(1, r.count) })),
        notes: notes.trim(),
      })
      if (existing) {
        const idx = d.events.findIndex((e) => e.id === existing.id)
        if (idx >= 0) {
          const kept = d.events[idx]
          d.events[idx] = { ...make(date), id: kept.id, roles: make(date).roles }
          createdId = kept.id
        }
        return
      }
      const dates = repeats ? previewDates : [date]
      if (repeats && dates.length > 1 && !finalSeriesId) {
        const s = { id: uid(), name: title.trim() }
        d.series.push(s)
        finalSeriesId = s.id
      }
      for (const dte of dates) {
        const ev = make(dte)
        d.events.push(ev)
        if (!createdId) createdId = ev.id
      }
    })
    onDone(createdId)
  }

  return (
    <div>
      <div className="page-head">
        <h1>{existing ? 'Edit event' : 'New event'}</h1>
      </div>
      <div className="card">
        <div className="grid-2">
          <Field label="Event title">
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Friday Karaoke Night" />
          </Field>
          <Field label="Venue">
            <input className="input" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Venue name" />
          </Field>
        </div>
        <div className="grid-3">
          <Field label="Date">
            <input
              className="input"
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value)
                setRec((r) => ({ ...r, weekdays: [parseISO(e.target.value).getDay()], until: e.target.value }))
              }}
            />
          </Field>
          <Field label="Start time">
            <input className="input" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </Field>
          <Field label="End time">
            <input className="input" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </Field>
        </div>
        <div className="grid-3">
          <Field label="Client type">
            <select className="input" value={clientType} onChange={(e) => setClientType(e.target.value as never)}>
              <option>Venue</option>
              <option>Individual</option>
              <option>Organization</option>
            </select>
          </Field>
          <Field label="Client (contact)">
            <select className="input" value={contactId} onChange={(e) => setContactId(e.target.value)}>
              <option value="">— None —</option>
              {db.contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Invoice amount ($)">
            <input className="input" inputMode="decimal" value={invoice} onChange={(e) => setInvoice(e.target.value)} placeholder="800" />
          </Field>
        </div>

        <h3>Roles needed</h3>
        {roles.map((r, i) => (
          <div key={i} className="row" style={{ marginBottom: 8 }}>
            <select
              className="input"
              style={{ flex: 1 }}
              value={r.qualification}
              onChange={(e) => setRoles(roles.map((x, j) => (j === i ? { ...x, qualification: e.target.value } : x)))}
            >
              {db.qualifications.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>
            <input
              className="input"
              style={{ width: 90 }}
              type="number"
              min={1}
              value={r.count}
              aria-label="Count"
              onChange={(e) => setRoles(roles.map((x, j) => (j === i ? { ...x, count: Number(e.target.value) } : x)))}
            />
            <button className="btn btn-small btn-ghost" onClick={() => setRoles(roles.filter((_, j) => j !== i))}>
              Remove
            </button>
          </div>
        ))}
        <button
          className="btn btn-small"
          onClick={() => setRoles([...roles, { qualification: db.qualifications[0] ?? 'Bartender', count: 1 }])}
        >
          Add role
        </button>

        <h3 style={{ marginTop: 16 }}>Series</h3>
        <div className="grid-2">
          <Field label="Link to a series">
            <select className="input" value={seriesId} onChange={(e) => setSeriesId(e.target.value)}>
              <option value="">— None —</option>
              {db.series.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Or create a new series">
            <input className="input" value={newSeriesName} onChange={(e) => setNewSeriesName(e.target.value)} placeholder="Series name" />
          </Field>
        </div>

        {!existing && (
          <>
            <h3 style={{ marginTop: 16 }}>Repeats</h3>
            <label className="row" style={{ marginBottom: 8 }}>
              <input type="checkbox" checked={repeats} onChange={(e) => setRepeats(e.target.checked)} />
              <span>Repeat this event</span>
            </label>
            {repeats && (
              <div className="card" style={{ background: 'var(--surface-2)' }}>
                <div className="grid-3">
                  <Field label="Repeats">
                    <select className="input" value={rec.freq} onChange={(e) => setRec({ ...rec, freq: e.target.value as never })}>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </Field>
                  <Field label="Every">
                    <span className="row">
                      <input
                        className="input"
                        type="number"
                        min={1}
                        max={12}
                        value={rec.interval}
                        onChange={(e) => setRec({ ...rec, interval: Math.max(1, Math.min(12, Number(e.target.value) || 1)) })}
                        style={{ width: 80 }}
                      />
                      <span className="muted small">{rec.freq === 'daily' ? 'day(s)' : rec.freq === 'weekly' ? 'week(s)' : 'month(s)'}</span>
                    </span>
                  </Field>
                  <Field label="Ends">
                    <select className="input" value={rec.endMode} onChange={(e) => setRec({ ...rec, endMode: e.target.value as never })}>
                      <option value="count">After a number of events</option>
                      <option value="until">On a date</option>
                    </select>
                  </Field>
                </div>
                {rec.freq === 'weekly' && (
                  <div style={{ marginBottom: 12 }}>
                    <span className="field-label">On these days</span>
                    <div className="row" style={{ marginTop: 6 }}>
                      {WEEKDAYS.map((d, i) => (
                        <button
                          key={d}
                          type="button"
                          className={`btn btn-small ${rec.weekdays.includes(i) ? 'btn-primary' : ''}`}
                          onClick={() =>
                            setRec({
                              ...rec,
                              weekdays: rec.weekdays.includes(i)
                                ? rec.weekdays.filter((x) => x !== i)
                                : [...rec.weekdays, i],
                            })
                          }
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {rec.endMode === 'count' ? (
                  <Field label="Number of events">
                    <input
                      className="input"
                      type="number"
                      min={1}
                      max={100}
                      value={rec.count}
                      onChange={(e) => setRec({ ...rec, count: Math.max(1, Number(e.target.value) || 1) })}
                      style={{ maxWidth: 140 }}
                    />
                  </Field>
                ) : (
                  <Field label="Repeat until">
                    <input className="input" type="date" value={rec.until} onChange={(e) => setRec({ ...rec, until: e.target.value })} style={{ maxWidth: 200 }} />
                  </Field>
                )}
                <p className="muted small" style={{ marginBottom: 0 }}>
                  {previewDates.length === 0
                    ? 'No dates match this rule yet.'
                    : `Creates ${previewDates.length} event${previewDates.length === 1 ? '' : 's'}: ${fmtDate(previewDates[0])} – ${fmtDate(previewDates[previewDates.length - 1])}, linked into a series so they can be invoiced together.`}
                </p>
              </div>
            )}
          </>
        )}

        <Field label="Notes">
          <textarea className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>

        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button className="btn" onClick={() => go('events')}>
            Cancel
          </button>
          <button className="btn btn-primary" disabled={!title.trim()} onClick={save}>
            {existing ? 'Save changes' : repeats && previewDates.length > 1 ? `Create ${previewDates.length} events` : 'Create event'}
          </button>
        </div>
      </div>
    </div>
  )
}

function EventDetail({ ev }: { ev: EventItem }) {
  const { db, update, go, openPerson, openGroup, openContact } = useApp()
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [rosterRole, setRosterRole] = useState<string | null>(null)

  if (editing) {
    return <EventForm existing={ev} onDone={() => setEditing(false)} />
  }

  const assignments = db.assignments.filter((a) => a.eventId === ev.id)
  const workerPay = eventWorkerPay(db, ev.id)
  const profit = eventProfit(db, ev)
  const contact = db.contacts.find((c) => c.id === ev.contactId)
  const series = ev.seriesId ? db.series.find((s) => s.id === ev.seriesId) : undefined
  const seriesEvents = series ? db.series && db.events.filter((e) => e.seriesId === series.id) : []
  const invoice = db.invoices.find((i) => i.eventIds.includes(ev.id))

  const duplicate = () => {
    let newId = ''
    update((d) => {
      const copy: EventItem = {
        ...JSON.parse(JSON.stringify(ev)),
        id: uid(),
        title: `${ev.title} (copy)`,
        roles: ev.roles.map((r) => ({ ...r, id: uid() })),
      }
      d.events.push(copy)
      newId = copy.id
    })
    go('events', { kind: 'event', id: newId })
  }

  const removeEvent = () => {
    update((d) => {
      d.events = d.events.filter((e) => e.id !== ev.id)
      d.assignments = d.assignments.filter((a) => a.eventId !== ev.id)
      d.invoices = d.invoices.map((i) => ({ ...i, eventIds: i.eventIds.filter((x) => x !== ev.id) }))
    })
    go('events')
  }

  return (
    <div>
      <div className="page-head">
        <h1>{ev.title}</h1>
        <span style={{ marginLeft: 'auto' }} className="row">
          <button className="btn" onClick={duplicate}>
            Duplicate event
          </button>
          <button className="btn" onClick={() => setEditing(true)}>
            Edit
          </button>
          <button className="btn btn-danger" onClick={() => setConfirmDelete(true)}>
            Delete
          </button>
        </span>
      </div>

      <div className="grid-2">
        <div className="card">
          <dl className="kv">
            <dt>Date</dt>
            <dd>{fmtDate(ev.date)}</dd>
            <dt>Time</dt>
            <dd>
              {fmtTime(ev.startTime)} – {fmtTime(ev.endTime)}
            </dd>
            <dt>Venue</dt>
            <dd>{ev.venue || '—'}</dd>
            <dt>Client type</dt>
            <dd>{ev.clientType}</dd>
            <dt>Client</dt>
            <dd>
              {contact ? (
                <a href="#" onClick={(e) => { e.preventDefault(); openContact(contact.id) }}>
                  {contact.name}
                </a>
              ) : (
                '—'
              )}
            </dd>
            {series && (
              <>
                <dt>Series</dt>
                <dd>
                  {series.name} ({seriesEvents.length} events)
                </dd>
              </>
            )}
            {ev.notes && (
              <>
                <dt>Notes</dt>
                <dd>{ev.notes}</dd>
              </>
            )}
          </dl>
        </div>
        <div className="card">
          <h2>Money</h2>
          <dl className="kv">
            <dt>Invoice amount</dt>
            <dd className="money">{money(ev.invoiceAmountCents)}</dd>
            <dt>Worker pay</dt>
            <dd className="money">{money(workerPay)}</dd>
            <dt>Profit</dt>
            <dd className={`money ${profit >= 0 ? 'positive' : 'negative'}`}>{money(profit)}</dd>
          </dl>
          <div className="row" style={{ marginTop: 12 }}>
            {invoice ? (
              <button className="btn btn-small" onClick={() => go('invoices', { kind: 'invoice', id: invoice.id })}>
                View invoice {invoice.number}
              </button>
            ) : (
              <button
                className="btn btn-small btn-primary"
                onClick={() => {
                  let id = ''
                  update((d) => {
                    const inv = {
                      id: uid(),
                      number: `INV-${d.nextInvoice}`,
                      contactId: ev.contactId,
                      eventIds: [ev.id],
                      issueDate: todayISO(),
                      dueDate: toISO(new Date(Date.now() + 14 * 86400000)),
                      status: 'draft' as const,
                      notes: '',
                    }
                    d.invoices.push(inv)
                    d.nextInvoice++
                    id = inv.id
                  })
                  go('invoices', { kind: 'invoice', id })
                }}
                disabled={!ev.contactId}
              >
                Generate invoice
              </button>
            )}
          </div>
          {!ev.contactId && <p className="muted small">Add a client contact to generate an invoice.</p>}
        </div>
      </div>

      <div className="card">
        <h2>
          Roster · {eventFilled(db, ev)}/{eventNeeded(db, ev)} filled
        </h2>
        {ev.roles.map((role) => {
          const filled = assignments.filter((a) => a.qualification === role.qualification)
          const open = role.count - filled.length
          return (
            <div key={role.id} style={{ marginBottom: 14 }}>
              <div className="row-between">
                <strong>
                  {role.qualification} · {filled.length}/{role.count}
                </strong>
                {open > 0 && (
                  <button className="btn btn-small btn-primary" onClick={() => setRosterRole(role.qualification)}>
                    Assign
                  </button>
                )}
              </div>
              {filled.map((a) => (
                <AssignmentRow key={a.id} a={a} />
              ))}
              {open > 0 && <p className="muted small" style={{ margin: '4px 0 0' }}>{open} spot{open === 1 ? '' : 's'} open.</p>}
            </div>
          )
        })}
        {ev.roles.length === 0 && <EmptyState>No roles set for this event.</EmptyState>}
      </div>

      {rosterRole && (
        <RosterPicker
          ev={ev}
          qualification={rosterRole}
          onClose={() => setRosterRole(null)}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete this event?"
          body={`"${ev.title}" and its roster assignments will be removed. Invoices that include it will keep the event removed from their line items.`}
          confirmLabel="Delete event"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={removeEvent}
        />
      )}
    </div>
  )
}

function AssignmentRow({ a }: { a: Assignment }) {
  const { db, update, openPerson, openGroup } = useApp()
  const person = a.personId ? db.people.find((p) => p.id === a.personId) : undefined
  const group = a.groupId ? db.groups.find((g) => g.id === a.groupId) : undefined
  const name = person?.name ?? group?.name ?? 'Unknown'
  const photo = person?.photo ?? group?.photo
  return (
    <div className="list-row">
      <Avatar name={name} photo={photo} size={34} />
      <div className="list-main">
        <div className="list-title">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              if (person) openPerson(person.id)
              else if (group) openGroup(group.id)
            }}
          >
            {name}
          </a>{' '}
          <span className="muted small">{group ? '(group)' : ''}</span>
        </div>
        <div className="list-sub">{a.qualification}</div>
      </div>
      <span className="money">{money(a.payCents)}</span>
      <button
        className="btn btn-small"
        onClick={() =>
          update((d) => {
            const x = d.assignments.find((z) => z.id === a.id)
            if (x) x.paid = !x.paid
          })
        }
      >
        {a.paid ? '✓ Paid' : 'Mark paid'}
      </button>
      <button
        className="btn btn-small btn-ghost"
        onClick={() =>
          update((d) => {
            d.assignments = d.assignments.filter((z) => z.id !== a.id)
          })
        }
      >
        Remove
      </button>
    </div>
  )
}

function RosterPicker({ ev, qualification, onClose }: { ev: EventItem; qualification: string; onClose: () => void }) {
  const { db, update } = useApp()
  const [pay, setPay] = useState('')
  const [selected, setSelected] = useState<{ kind: 'person' | 'group'; id: string } | null>(null)

  const people = db.people.filter((p) => p.qualifications.includes(qualification))
  const groups = db.groups.filter((g) => g.qualifications.includes(qualification))

  const availPeople = people.filter((p) => !personBookedDates(db, p.id).has(ev.date))
  const unavailPeople = people.filter((p) => personBookedDates(db, p.id).has(ev.date))
  const availGroups = groups.filter((g) => !groupBookedDates(db, g.id).has(ev.date))
  const unavailGroups = groups.filter((g) => groupBookedDates(db, g.id).has(ev.date))

  const assign = () => {
    if (!selected) return
    update((d) => {
      d.assignments.push({
        id: uid(),
        eventId: ev.id,
        personId: selected.kind === 'person' ? selected.id : undefined,
        groupId: selected.kind === 'group' ? selected.id : undefined,
        qualification,
        payCents: dollarsToCents(pay),
        paid: false,
      })
    })
    onClose()
  }

  return (
    <Modal title={`Assign ${qualification}`} onClose={onClose}>
      {(availPeople.length > 0 || availGroups.length > 0) && (
        <>
          <h3>Available</h3>
          {availPeople.map((p) => (
            <div key={p.id} className="list-row clickable" onClick={() => setSelected({ kind: 'person', id: p.id })}>
              <Avatar name={p.name} photo={p.photo} size={34} />
              <div className="list-main">
                <div className="list-title">{p.name}</div>
                <div className="list-sub">{p.qualifications.join(', ')}</div>
              </div>
              {selected?.kind === 'person' && selected.id === p.id && <span className="chip">Selected</span>}
            </div>
          ))}
          {availGroups.map((g) => (
            <div key={g.id} className="list-row clickable" onClick={() => setSelected({ kind: 'group', id: g.id })}>
              <Avatar name={g.name} photo={g.photo} size={34} />
              <div className="list-main">
                <div className="list-title">{g.name}</div>
                <div className="list-sub">
                  {g.kind} · {g.memberIds.map((id) => db.people.find((p) => p.id === id)?.name).filter(Boolean).join(', ')}
                </div>
              </div>
              {selected?.kind === 'group' && selected.id === g.id && <span className="chip">Selected</span>}
            </div>
          ))}
        </>
      )}
      {(unavailPeople.length > 0 || unavailGroups.length > 0) && (
        <>
          <h3 style={{ marginTop: 14 }}>Unavailable</h3>
          {unavailPeople.map((p) => (
            <div key={p.id} className="list-row" style={{ opacity: 0.6 }}>
              <Avatar name={p.name} photo={p.photo} size={34} />
              <div className="list-main">
                <div className="list-title">{p.name}</div>
                <div className="list-sub">Already booked on {fmtDate(ev.date)}</div>
              </div>
            </div>
          ))}
          {unavailGroups.map((g) => (
            <div key={g.id} className="list-row" style={{ opacity: 0.6 }}>
              <Avatar name={g.name} photo={g.photo} size={34} />
              <div className="list-main">
                <div className="list-title">{g.name}</div>
                <div className="list-sub">A member is already booked on {fmtDate(ev.date)}</div>
              </div>
            </div>
          ))}
        </>
      )}
      {availPeople.length === 0 && availGroups.length === 0 && unavailPeople.length === 0 && unavailGroups.length === 0 && (
        <EmptyState>No crew or groups hold the {qualification} qualification yet.</EmptyState>
      )}
      <Field label="Offered pay for this event ($)">
        <input className="input" inputMode="decimal" value={pay} onChange={(e) => setPay(e.target.value)} placeholder="200" />
      </Field>
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <button className="btn" onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-primary" disabled={!selected} onClick={assign}>
          Assign
        </button>
      </div>
    </Modal>
  )
}
