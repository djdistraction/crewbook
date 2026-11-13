// CrewBook Documents: printable sheets, previewed in-app and downloadable as a page.
import React, { useMemo, useState } from 'react'
import {
  downloadFile,
  eventAssignments,
  eventFilled,
  eventNeeded,
  eventProfit,
  eventWorkerPay,
  fmtDate,
  fmtTime,
  groupEarned,
  invoiceTotal,
  money,
  personEarned,
  todayISO,
  toISO,
} from '../lib'
import { useApp } from '../store'
import { EmptyState } from '../ui'

type DocKind =
  | 'overview-day'
  | 'overview-week'
  | 'overview-month'
  | 'overview-year'
  | 'crew-by-qual'
  | 'crew-directory'
  | 'person-profile'
  | 'group-profile'
  | 'contacts'
  | 'invoices'
  | 'event-sheet'
  | 'awaiting'

const DOCS: { kind: DocKind; label: string; group: string }[] = [
  { kind: 'overview-day', label: 'Daily overview', group: 'Overviews' },
  { kind: 'overview-week', label: 'Weekly overview', group: 'Overviews' },
  { kind: 'overview-month', label: 'Monthly overview', group: 'Overviews' },
  { kind: 'overview-year', label: 'Yearly overview', group: 'Overviews' },
  { kind: 'crew-by-qual', label: 'Crew list by qualification', group: 'Crew' },
  { kind: 'crew-directory', label: 'Full crew directory', group: 'Crew' },
  { kind: 'person-profile', label: 'Individual crew profile', group: 'Crew' },
  { kind: 'group-profile', label: 'Group profile', group: 'Crew' },
  { kind: 'contacts', label: 'Contacts list', group: 'Clients' },
  { kind: 'invoices', label: 'Invoices list', group: 'Clients' },
  { kind: 'event-sheet', label: 'Event sheet', group: 'Events' },
  { kind: 'awaiting', label: 'Awaiting payment list', group: 'Money' },
]

export function Documents() {
  const { db } = useApp()
  const [kind, setKind] = useState<DocKind>('overview-week')
  const [date, setDate] = useState(todayISO())
  const [qual, setQual] = useState('')
  const [personId, setPersonId] = useState('')
  const [groupId, setGroupId] = useState('')
  const [eventId, setEventId] = useState('')

  const title = useMemo(() => {
    switch (kind) {
      case 'overview-day':
        return `Daily overview — ${fmtDate(date)}`
      case 'overview-week': {
        const d = new Date(date)
        const dow = d.getDay()
        const start = new Date(d)
        start.setDate(d.getDate() - dow)
        const end = new Date(start)
        end.setDate(start.getDate() + 6)
        return `Weekly overview — ${fmtDate(toISO(start))} to ${fmtDate(toISO(end))}`
      }
      case 'overview-month': {
        const d = new Date(date)
        return `Monthly overview — ${d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
      }
      case 'overview-year': {
        const d = new Date(date)
        return `Yearly overview — ${d.getFullYear()}`
      }
      case 'crew-by-qual':
        return `Crew — ${qual || 'All qualifications'}`
      case 'crew-directory':
        return 'Crew directory'
      case 'person-profile': {
        const p = db.people.find((x) => x.id === personId)
        return p ? `Crew profile — ${p.name}` : 'Crew profile'
      }
      case 'group-profile': {
        const g = db.groups.find((x) => x.id === groupId)
        return g ? `Group profile — ${g.name}` : 'Group profile'
      }
      case 'contacts':
        return 'Contacts'
      case 'invoices':
        return 'Invoices'
      case 'event-sheet': {
        const ev = db.events.find((x) => x.id === eventId)
        return ev ? `Event sheet — ${ev.title}` : 'Event sheet'
      }
      case 'awaiting':
        return 'Awaiting payment'
    }
  }, [kind, date, qual, personId, groupId, eventId, db])

  const body = useMemo(() => renderDoc(db, kind, { date, qual, personId, groupId, eventId }), [db, kind, date, qual, personId, groupId, eventId])

  const download = () => {
    const c = db.company
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:Arial,Helvetica,sans-serif;color:#1e293b;max-width:800px;margin:40px auto;padding:0 20px}h1{font-size:22px}h2{font-size:16px;margin-top:24px}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:6px 8px;border-bottom:1px solid #cbd5e1}th{font-size:12px;text-transform:uppercase;color:#64748b}.num{text-align:right}.muted{color:#64748b}@media print{body{margin:0}}</style></head><body><h1>${c.name || 'CrewBook'}</h1><p class="muted">${c.tagline || ''}</p><h1>${title}</h1>${body}<p class="muted">© HTXpunk LLC. All rights reserved.</p></body></html>`
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    downloadFile(`${slug}.html`, html, 'text/html')
  }

  return (
    <div>
      <div className="page-head">
        <h1>Documents</h1>
        <p>Printable sheets for the book.</p>
      </div>

      <div className="card">
        <div className="tabs-inline" style={{ marginBottom: 12 }}>
          {DOCS.map((d) => (
            <button key={d.kind} className={kind === d.kind ? 'active' : ''} onClick={() => setKind(d.kind)}>
              {d.label}
            </button>
          ))}
        </div>

        <div className="row" style={{ marginBottom: 12 }}>
          {kind.startsWith('overview') && (
            <label className="row">
              <span className="field-label">Date</span>
              <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: 170 }} />
            </label>
          )}
          {kind === 'crew-by-qual' && (
            <label className="row">
              <span className="field-label">Qualification</span>
              <select className="input" value={qual} onChange={(e) => setQual(e.target.value)} style={{ width: 200 }}>
                <option value="">All</option>
                {db.qualifications.map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>
            </label>
          )}
          {kind === 'person-profile' && (
            <label className="row">
              <span className="field-label">Crew member</span>
              <select className="input" value={personId} onChange={(e) => setPersonId(e.target.value)} style={{ width: 220 }}>
                <option value="">— Choose —</option>
                {db.people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {kind === 'group-profile' && (
            <label className="row">
              <span className="field-label">Group</span>
              <select className="input" value={groupId} onChange={(e) => setGroupId(e.target.value)} style={{ width: 220 }}>
                <option value="">— Choose —</option>
                {db.groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {kind === 'event-sheet' && (
            <label className="row">
              <span className="field-label">Event</span>
              <select className="input" value={eventId} onChange={(e) => setEventId(e.target.value)} style={{ width: 260 }}>
                <option value="">— Choose —</option>
                {db.events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {fmtDate(ev.date)} · {ev.title}
                  </option>
                ))}
              </select>
            </label>
          )}
          <span style={{ marginLeft: 'auto' }}>
            <button className="btn btn-primary" onClick={download}>
              Download printable page
            </button>
          </span>
        </div>
      </div>

      <div className="card doc-preview">
        <h2>{title}</h2>
        {body ? <div dangerouslySetInnerHTML={{ __html: body }} /> : <EmptyState>Choose the details above to build this sheet.</EmptyState>}
      </div>
    </div>
  )
}

function rows<T>(items: T[], render: (x: T) => string): string {
  if (items.length === 0) return '<p>No records.</p>'
  return items.map(render).join('')
}

function renderDoc(
  db: import('../lib').DB,
  kind: DocKind,
  sel: { date: string; qual: string; personId: string; groupId: string; eventId: string },
): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
  const c = db.company

  switch (kind) {
    case 'overview-day': {
      const events = db.events.filter((e) => e.date === sel.date).sort((a, b) => a.startTime.localeCompare(b.startTime))
      const total = events.reduce((s, e) => s + e.invoiceAmountCents, 0)
      return `<p>${events.length} event(s) · ${money(total)} invoiced</p><table><thead><tr><th>Time</th><th>Event</th><th>Venue</th><th>Roster</th><th class="num">Invoice</th></tr></thead><tbody>${rows(
        events,
        (ev) => `<tr><td>${fmtTime(ev.startTime)} – ${fmtTime(ev.endTime)}</td><td>${esc(ev.title)}</td><td>${esc(ev.venue)}</td><td>${eventFilled(db, ev)}/${eventNeeded(db, ev)} filled</td><td class="num">${money(ev.invoiceAmountCents)}</td></tr>`,
      )}</tbody></table>`
    }
    case 'overview-week':
    case 'overview-month':
    case 'overview-year': {
      const d = new Date(sel.date)
      let start: string
      let end: string
      if (kind === 'overview-week') {
        const s = new Date(d)
        s.setDate(d.getDate() - d.getDay())
        const e = new Date(s)
        e.setDate(s.getDate() + 6)
        start = toISO(s)
        end = toISO(e)
      } else if (kind === 'overview-month') {
        start = toISO(new Date(d.getFullYear(), d.getMonth(), 1))
        end = toISO(new Date(d.getFullYear(), d.getMonth() + 1, 0))
      } else {
        start = toISO(new Date(d.getFullYear(), 0, 1))
        end = toISO(new Date(d.getFullYear(), 11, 31))
      }
      const events = db.events.filter((e) => e.date >= start && e.date <= end).sort((a, b) => a.date.localeCompare(b.date))
      const invoiced = events.reduce((s, e) => s + e.invoiceAmountCents, 0)
      const pay = events.reduce((s, e) => s + eventWorkerPay(db, e.id), 0)
      const profit = invoiced - pay
      return `<p>${events.length} event(s) · Invoiced ${money(invoiced)} · Worker pay ${money(pay)} · Profit ${money(profit)}</p><table><thead><tr><th>Date</th><th>Event</th><th>Venue</th><th>Roster</th><th class="num">Invoice</th><th class="num">Profit</th></tr></thead><tbody>${rows(
        events,
        (ev) =>
          `<tr><td>${fmtDate(ev.date)}</td><td>${esc(ev.title)}</td><td>${esc(ev.venue)}</td><td>${eventFilled(db, ev)}/${eventNeeded(db, ev)} filled</td><td class="num">${money(ev.invoiceAmountCents)}</td><td class="num">${money(eventProfit(db, ev))}</td></tr>`,
      )}</tbody></table>`
    }
    case 'crew-by-qual': {
      const people = db.people
        .filter((p) => !sel.qual || p.qualifications.includes(sel.qual))
        .sort((a, b) => a.name.localeCompare(b.name))
      const groups = db.groups.filter((g) => !sel.qual || g.qualifications.includes(sel.qual))
      return `<h2>Crew</h2><table><thead><tr><th>Name</th><th>Qualifications</th><th>Phone</th><th>Email</th></tr></thead><tbody>${rows(
        people,
        (p) => `<tr><td>${esc(p.name)}</td><td>${esc(p.qualifications.join(', '))}</td><td>${esc(p.phone)}</td><td>${esc(p.email)}</td></tr>`,
      )}</tbody></table>${groups.length ? `<h2>Groups</h2><table><thead><tr><th>Name</th><th>Type</th><th>Qualifications</th><th>Members</th></tr></thead><tbody>${rows(
        groups,
        (g) =>
          `<tr><td>${esc(g.name)}</td><td>${esc(g.kind)}</td><td>${esc(g.qualifications.join(', '))}</td><td>${esc(g.memberIds.map((id) => db.people.find((p) => p.id === id)?.name).filter(Boolean).join(', '))}</td></tr>`,
      )}</tbody></table>` : ''}`
    }
    case 'crew-directory': {
      const people = [...db.people].sort((a, b) => a.name.localeCompare(b.name))
      return `<table><thead><tr><th>Name</th><th>Qualifications</th><th>Phone</th><th>Email</th><th>Preferred payment</th></tr></thead><tbody>${rows(
        people,
        (p) =>
          `<tr><td>${esc(p.name)}</td><td>${esc(p.qualifications.join(', '))}</td><td>${esc(p.phone)}</td><td>${esc(p.email)}</td><td>${esc(p.paymentMethod)} ${esc(p.paymentHandle)}</td></tr>`,
      )}</tbody></table>`
    }
    case 'person-profile': {
      const p = db.people.find((x) => x.id === sel.personId)
      if (!p) return ''
      const { earned, owed } = personEarned(db, p.id)
      const history = db.assignments
        .filter((a) => a.personId === p.id)
        .map((a) => ({ a, ev: db.events.find((e) => e.id === a.eventId) }))
        .sort((x, y) => (y.ev?.date ?? '').localeCompare(x.ev?.date ?? ''))
      return `<p>${esc(p.qualifications.join(', '))}</p><p>Phone: ${esc(p.phone)}<br>Email: ${esc(p.email)}<br>Preferred payment: ${esc(p.paymentMethod)} ${esc(p.paymentHandle)}</p><p>Total earned: ${money(earned)} · Still owed: ${money(owed)}</p><h2>Work &amp; pay history</h2><table><thead><tr><th>Date</th><th>Event</th><th>Role</th><th class="num">Pay</th><th>Status</th></tr></thead><tbody>${rows(
        history,
        ({ a, ev }) =>
          `<tr><td>${ev ? fmtDate(ev.date) : ''}</td><td>${ev ? esc(ev.title) : ''}</td><td>${esc(a.qualification)}</td><td class="num">${money(a.payCents)}</td><td>${a.paid ? 'Paid' : 'Unpaid'}</td></tr>`,
      )}</tbody></table>`
    }
    case 'group-profile': {
      const g = db.groups.find((x) => x.id === sel.groupId)
      if (!g) return ''
      const { earned, owed } = groupEarned(db, g.id)
      const history = db.assignments
        .filter((a) => a.groupId === g.id)
        .map((a) => ({ a, ev: db.events.find((e) => e.id === a.eventId) }))
        .sort((x, y) => (y.ev?.date ?? '').localeCompare(x.ev?.date ?? ''))
      const members = g.memberIds.map((id) => db.people.find((p) => p.id === id)?.name).filter(Boolean)
      return `<p>${esc(g.kind)} · ${esc(g.qualifications.join(', '))}</p><p>Members: ${esc(members.join(', '))}</p><p>Total earned: ${money(earned)} · Still owed: ${money(owed)}</p><h2>Work &amp; pay history</h2><table><thead><tr><th>Date</th><th>Event</th><th>Role</th><th class="num">Pay</th><th>Status</th></tr></thead><tbody>${rows(
        history,
        ({ a, ev }) =>
          `<tr><td>${ev ? fmtDate(ev.date) : ''}</td><td>${ev ? esc(ev.title) : ''}</td><td>${esc(a.qualification)}</td><td class="num">${money(a.payCents)}</td><td>${a.paid ? 'Paid' : 'Unpaid'}</td></tr>`,
      )}</tbody></table>`
    }
    case 'contacts': {
      const contacts = [...db.contacts].sort((a, b) => a.name.localeCompare(b.name))
      return `<table><thead><tr><th>Name</th><th>Type</th><th>Contact person</th><th>Phone</th><th>Email</th><th>Address</th></tr></thead><tbody>${rows(
        contacts,
        (ct) => `<tr><td>${esc(ct.name)}</td><td>${esc(ct.type)}</td><td>${esc(ct.contactPerson)}</td><td>${esc(ct.phone)}</td><td>${esc(ct.email)}</td><td>${esc(ct.address)}</td></tr>`,
      )}</tbody></table>`
    }
    case 'invoices': {
      const invs = [...db.invoices].sort((a, b) => b.number.localeCompare(a.number))
      return `<table><thead><tr><th>Invoice</th><th>Client</th><th>Events</th><th>Due</th><th>Status</th><th class="num">Total</th></tr></thead><tbody>${rows(
        invs,
        (inv) => {
          const ct = db.contacts.find((x) => x.id === inv.contactId)
          return `<tr><td>${esc(inv.number)}</td><td>${ct ? esc(ct.name) : ''}</td><td>${inv.eventIds.length}</td><td>${fmtDate(inv.dueDate)}</td><td>${inv.status}</td><td class="num">${money(invoiceTotal(db, inv))}</td></tr>`
        },
      )}</tbody></table>`
    }
    case 'event-sheet': {
      const ev = db.events.find((x) => x.id === sel.eventId)
      if (!ev) return ''
      const assignments = eventAssignments(db, ev.id)
      const contact = db.contacts.find((x) => x.id === ev.contactId)
      return `<p>${fmtDate(ev.date)} · ${fmtTime(ev.startTime)} – ${fmtTime(ev.endTime)}<br>Venue: ${esc(ev.venue)}<br>Client: ${contact ? esc(contact.name) : esc(ev.clientType)}</p><p>Invoice: ${money(ev.invoiceAmountCents)} · Worker pay: ${money(eventWorkerPay(db, ev.id))} · Profit: ${money(eventProfit(db, ev))}</p><h2>Roster</h2><table><thead><tr><th>Name</th><th>Role</th><th class="num">Pay</th><th>Status</th></tr></thead><tbody>${rows(
        assignments,
        (a) => {
          const person = a.personId ? db.people.find((p) => p.id === a.personId) : undefined
          const group = a.groupId ? db.groups.find((g) => g.id === a.groupId) : undefined
          return `<tr><td>${esc(person?.name ?? group?.name ?? '')}</td><td>${esc(a.qualification)}</td><td class="num">${money(a.payCents)}</td><td>${a.paid ? 'Paid' : 'Unpaid'}</td></tr>`
        },
      )}</tbody></table>${ev.notes ? `<p>Notes: ${esc(ev.notes)}</p>` : ''}`
    }
    case 'awaiting': {
      const items = db.assignments
        .filter((a) => !a.paid)
        .map((a) => ({ a, ev: db.events.find((e) => e.id === a.eventId) }))
        .sort((x, y) => (x.ev?.date ?? '').localeCompare(y.ev?.date ?? ''))
      const total = items.reduce((s, x) => s + x.a.payCents, 0)
      return `<p>${items.length} unpaid assignment(s) · ${money(total)} owed in total</p><table><thead><tr><th>Date</th><th>Event</th><th>Name</th><th>Role</th><th class="num">Pay</th></tr></thead><tbody>${rows(
        items,
        ({ a, ev }) => {
          const person = a.personId ? db.people.find((p) => p.id === a.personId) : undefined
          const group = a.groupId ? db.groups.find((g) => g.id === a.groupId) : undefined
          return `<tr><td>${ev ? fmtDate(ev.date) : ''}</td><td>${ev ? esc(ev.title) : ''}</td><td>${esc(person?.name ?? group?.name ?? '')}</td><td>${esc(a.qualification)}</td><td class="num">${money(a.payCents)}</td></tr>`
        },
      )}</tbody></table>`
    }
  }
  void c
  return ''
}
