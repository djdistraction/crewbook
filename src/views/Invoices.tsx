// CrewBook Invoices: generate for one event or a whole series, track status.
import React, { useState } from 'react'
import { Invoice, fmtDate, invoiceText, invoiceTotal, money, todayISO, toISO, uid } from '../lib'
import { useApp } from '../store'
import { ConfirmDialog, EmptyState, Field, Modal } from '../ui'

export function Invoices() {
  const { db, route, go } = useApp()
  const detail = route.detail

  if (detail?.kind === 'invoice') {
    if (detail.id === 'new') {
      return <InvoiceForm onDone={(id) => (id ? go('invoices', { kind: 'invoice', id }) : go('invoices'))} />
    }
    const inv = db.invoices.find((i) => i.id === detail.id)
    if (!inv) return <EmptyState>That invoice no longer exists.</EmptyState>
    return <InvoiceDetail inv={inv} />
  }

  const sorted = [...db.invoices].sort((a, b) => b.number.localeCompare(a.number))

  return (
    <div>
      <div className="page-head">
        <h1>Invoices</h1>
        <p>Bill clients for single events or whole series.</p>
        <span style={{ marginLeft: 'auto' }}>
          <button className="btn btn-primary" onClick={() => go('invoices', { kind: 'invoice', id: 'new' })}>
            New invoice
          </button>
        </span>
      </div>
      {sorted.length === 0 ? (
        <div className="card">
          <EmptyState>
            No invoices yet. Generate one from an event page, or create one here and pick the events it covers.
          </EmptyState>
        </div>
      ) : (
        <div className="card">
          {sorted.map((inv) => {
            const contact = db.contacts.find((c) => c.id === inv.contactId)
            return (
              <div key={inv.id} className="list-row clickable" onClick={() => go('invoices', { kind: 'invoice', id: inv.id })}>
                <div className="list-main">
                  <div className="list-title">
                    {inv.number} · {contact?.name ?? 'No client'}
                  </div>
                  <div className="list-sub">
                    {inv.eventIds.length} {inv.eventIds.length === 1 ? 'event' : 'events'} · due {fmtDate(inv.dueDate)}
                  </div>
                </div>
                <span className={`chip ${inv.status === 'paid' ? 'chip-green' : inv.status === 'sent' ? '' : 'chip-grey'}`}>
                  {inv.status}
                </span>
                <span className="money">{money(invoiceTotal(db, inv))}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function InvoiceForm({ onDone }: { onDone: (id: string) => void }) {
  const { db, update } = useApp()
  const [contactId, setContactId] = useState('')
  const [eventIds, setEventIds] = useState<string[]>([])
  const [dueDate, setDueDate] = useState(toISO(new Date(Date.now() + 14 * 86400000)))
  const [notes, setNotes] = useState('')

  const contactEvents = db.events.filter((e) => (contactId ? e.contactId === contactId : true))

  const save = () => {
    if (!contactId || eventIds.length === 0) return
    let id = ''
    update((d) => {
      const inv: Invoice = {
        id: uid(),
        number: `INV-${d.nextInvoice}`,
        contactId,
        eventIds,
        issueDate: todayISO(),
        dueDate,
        status: 'draft',
        notes: notes.trim(),
      }
      d.invoices.push(inv)
      d.nextInvoice++
      id = inv.id
    })
    onDone(id)
  }

  return (
    <Modal title="New invoice" onClose={() => onDone('')}>
      <Field label="Bill to (client)">
        <select
          className="input"
          value={contactId}
          onChange={(e) => {
            setContactId(e.target.value)
            setEventIds([])
          }}
        >
          <option value="">— Choose a client —</option>
          {db.contacts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Events to bill">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {contactEvents.length === 0 && <span className="muted small">No events for this client yet.</span>}
          {contactEvents.map((ev) => (
            <label key={ev.id} className="row" style={{ gap: 6 }}>
              <input
                type="checkbox"
                checked={eventIds.includes(ev.id)}
                onChange={() =>
                  setEventIds(eventIds.includes(ev.id) ? eventIds.filter((x) => x !== ev.id) : [...eventIds, ev.id])
                }
              />
              <span>
                {fmtDate(ev.date)} · {ev.title} · {money(ev.invoiceAmountCents)}
              </span>
            </label>
          ))}
        </div>
      </Field>
      <Field label="Due date">
        <input className="input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </Field>
      <Field label="Notes">
        <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <button className="btn" onClick={() => onDone('')}>
          Cancel
        </button>
        <button className="btn btn-primary" disabled={!contactId || eventIds.length === 0} onClick={save}>
          Create invoice
        </button>
      </div>
    </Modal>
  )
}

function InvoiceDetail({ inv }: { inv: Invoice }) {
  const { db, update, go, openEvent, openContact } = useApp()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [copied, setCopied] = useState(false)

  const contact = db.contacts.find((c) => c.id === inv.contactId)
  const c = db.company
  const total = invoiceTotal(db, inv)

  const setStatus = (status: Invoice['status']) => {
    update((d) => {
      const x = d.invoices.find((i) => i.id === inv.id)
      if (x) x.status = status
    })
  }

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(invoiceText(db, inv))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div>
      <div className="page-head">
        <button className="btn btn-small" onClick={() => go('invoices')}>
          ← Invoices
        </button>
        <span style={{ marginLeft: 'auto' }} className="row">
          <button className="btn" onClick={copyText}>
            {copied ? '✓ Copied' : 'Copy invoice text'}
          </button>
          <button className="btn btn-danger" onClick={() => setConfirmDelete(true)}>
            Delete
          </button>
        </span>
      </div>

      <div className="card doc-preview">
        <div className="row-between">
          <div>
            {c.logo && <img src={c.logo} alt="" style={{ maxHeight: 56, marginBottom: 8 }} />}
            <h2 style={{ margin: 0 }}>{c.name || 'CrewBook'}</h2>
            {c.tagline && <p className="muted" style={{ margin: '2px 0 0' }}>{c.tagline}</p>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 20, fontWeight: 800 }}>INVOICE {inv.number}</div>
            <div className="muted small">Issued {fmtDate(inv.issueDate)}</div>
            <div className="muted small">Due {fmtDate(inv.dueDate)}</div>
          </div>
        </div>

        <div className="grid-2" style={{ marginTop: 16 }}>
          <div>
            <h3>Bill to</h3>
            {contact ? (
              <p style={{ margin: 0 }}>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    openContact(contact.id)
                  }}
                >
                  <strong>{contact.name}</strong>
                </a>
                <br />
                {contact.contactPerson && (
                  <>
                    Attn: {contact.contactPerson}
                    <br />
                  </>
                )}
                {contact.address && (
                  <>
                    {contact.address}
                    <br />
                  </>
                )}
                {contact.phone && (
                  <>
                    {contact.phone}
                    <br />
                  </>
                )}
                {contact.email}
              </p>
            ) : (
              <p className="muted">No client linked.</p>
            )}
          </div>
          <div>
            <h3>From</h3>
            <p style={{ margin: 0 }}>
              {c.name}
              <br />
              {c.owner && (
                <>
                  {c.owner}
                  <br />
                </>
              )}
              {c.address && (
                <>
                  {c.address}
                  <br />
                </>
              )}
              {c.phone && (
                <>
                  {c.phone}
                  <br />
                </>
              )}
              {c.email && (
                <>
                  {c.email}
                  <br />
                </>
              )}
              {c.website}
            </p>
          </div>
        </div>

        <table className="table" style={{ marginTop: 16 }}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Event</th>
              <th className="num">Amount</th>
            </tr>
          </thead>
          <tbody>
            {inv.eventIds.map((id) => {
              const ev = db.events.find((e) => e.id === id)
              if (!ev) return null
              return (
                <tr key={id}>
                  <td>{fmtDate(ev.date)}</td>
                  <td>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        openEvent(ev.id)
                      }}
                    >
                      {ev.title}
                    </a>
                  </td>
                  <td className="num">{money(ev.invoiceAmountCents)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div style={{ textAlign: 'right', marginTop: 12 }}>
          <div style={{ fontSize: 18 }}>
            Total due: <span className="money">{money(total)}</span>
          </div>
          {c.paymentTerms && <div className="muted small">Terms: {c.paymentTerms}</div>}
        </div>
        {inv.notes && <p className="muted">{inv.notes}</p>}
      </div>

      <div className="card">
        <h2>Status</h2>
        <div className="tabs-inline">
          {(['draft', 'sent', 'paid'] as const).map((s) => (
            <button key={s} className={inv.status === s ? 'active' : ''} onClick={() => setStatus(s)}>
              {s[0].toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title={`Delete invoice ${inv.number}?`}
          body="The invoice will be removed. The events it covered stay on the books."
          confirmLabel="Delete invoice"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            update((d) => {
              d.invoices = d.invoices.filter((i) => i.id !== inv.id)
            })
            go('invoices')
          }}
        />
      )}
    </div>
  )
}
