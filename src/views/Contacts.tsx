// CrewBook Contacts: client database with profiles and event history.
import React, { useState } from 'react'
import { Contact, contactTotals, fmtDate, invoiceTotal, money, uid } from '../lib'
import { useApp } from '../store'
import { ConfirmDialog, EmptyState, Field, Modal } from '../ui'

const TYPES = ['Venue', 'Individual', 'Organization'] as const

export function Contacts() {
  const { db, route, go } = useApp()
  const detail = route.detail

  if (detail?.kind === 'contact') {
    if (detail.id === 'new') {
      return <ContactForm onDone={(id) => (id ? go('contacts', { kind: 'contact', id }) : go('contacts'))} />
    }
    const contact = db.contacts.find((c) => c.id === detail.id)
    if (!contact) return <EmptyState>That contact no longer exists.</EmptyState>
    return <ContactProfile contactId={contact.id} />
  }

  const sorted = [...db.contacts].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div>
      <div className="page-head">
        <h1>Contacts</h1>
        <p>Every client who hires you — venues, individuals, organizations.</p>
        <span style={{ marginLeft: 'auto' }}>
          <button className="btn btn-primary" onClick={() => go('contacts', { kind: 'contact', id: 'new' })}>
            Add contact
          </button>
        </span>
      </div>
      {sorted.length === 0 ? (
        <div className="card">
          <EmptyState>No contacts yet.</EmptyState>
        </div>
      ) : (
        <div className="card">
          {sorted.map((c) => {
            const t = contactTotals(db, c.id)
            return (
              <div key={c.id} className="list-row clickable" onClick={() => go('contacts', { kind: 'contact', id: c.id })}>
                <div className="list-main">
                  <div className="list-title">{c.name}</div>
                  <div className="list-sub">
                    {c.type}
                    {c.contactPerson ? ` · ${c.contactPerson}` : ''}
                    {c.phone ? ` · ${c.phone}` : ''}
                  </div>
                </div>
                <span className="chip">{t.events} {t.events === 1 ? 'event' : 'events'}</span>
                <span className="money">{money(t.bookedValue)}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function ContactForm({ existing, onDone }: { existing?: Contact; onDone: (id: string) => void }) {
  const { update } = useApp()
  const [name, setName] = useState(existing?.name ?? '')
  const [type, setType] = useState<(typeof TYPES)[number]>(existing?.type ?? 'Venue')
  const [contactPerson, setContactPerson] = useState(existing?.contactPerson ?? '')
  const [phone, setPhone] = useState(existing?.phone ?? '')
  const [email, setEmail] = useState(existing?.email ?? '')
  const [address, setAddress] = useState(existing?.address ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')

  const save = () => {
    if (!name.trim()) return
    let id = existing?.id ?? ''
    update((d) => {
      if (existing) {
        const c = d.contacts.find((x) => x.id === existing.id)
        if (c) {
          c.name = name.trim()
          c.type = type
          c.contactPerson = contactPerson.trim()
          c.phone = phone.trim()
          c.email = email.trim()
          c.address = address.trim()
          c.notes = notes.trim()
        }
        id = existing.id
      } else {
        const c: Contact = {
          id: uid(),
          name: name.trim(),
          type,
          contactPerson: contactPerson.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
          notes: notes.trim(),
        }
        d.contacts.push(c)
        id = c.id
      }
    })
    onDone(id)
  }

  return (
    <Modal title={existing ? 'Edit contact' : 'Add contact'} onClose={() => onDone(existing?.id ?? '')}>
      <Field label="Name">
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Venue, person, or organization" />
      </Field>
      <Field label="Type">
        <select className="input" value={type} onChange={(e) => setType(e.target.value as never)}>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Contact person">
        <input className="input" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
      </Field>
      <div className="grid-2">
        <Field label="Phone">
          <input className="input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label="Email">
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
      </div>
      <Field label="Address">
        <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} />
      </Field>
      <Field label="Notes">
        <textarea className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <button className="btn" onClick={() => onDone(existing?.id ?? '')}>
          Cancel
        </button>
        <button className="btn btn-primary" disabled={!name.trim()} onClick={save}>
          {existing ? 'Save changes' : 'Add contact'}
        </button>
      </div>
    </Modal>
  )
}

function ContactProfile({ contactId }: { contactId: string }) {
  const { db, update, go, openEvent, openInvoice } = useApp()
  const contact = db.contacts.find((c) => c.id === contactId)
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!contact) return <EmptyState>That contact no longer exists.</EmptyState>
  if (editing) {
    return <ContactForm existing={contact} onDone={() => setEditing(false)} />
  }

  const t = contactTotals(db, contact.id)
  const events = db.events.filter((e) => e.contactId === contact.id).sort((a, b) => b.date.localeCompare(a.date))
  const invoices = db.invoices.filter((i) => i.contactId === contact.id)
  const linkedSeries = db.series.filter((s) => db.events.some((e) => e.contactId === contact.id && e.seriesId === s.id))

  return (
    <div>
      <div className="page-head">
        <button className="btn btn-small" onClick={() => go('contacts')}>
          ← Contacts
        </button>
        <span style={{ marginLeft: 'auto' }} className="row">
          <button className="btn" onClick={() => setEditing(true)}>
            Edit
          </button>
          <button className="btn btn-danger" onClick={() => setConfirmDelete(true)}>
            Delete
          </button>
        </span>
      </div>

      <div className="card">
        <h1 style={{ margin: '0 0 4px', fontSize: 22 }}>{contact.name}</h1>
        <p className="muted" style={{ marginTop: 0 }}>
          {contact.type}
          {contact.contactPerson ? ` · ${contact.contactPerson}` : ''}
        </p>
        <dl className="kv">
          {contact.phone && (
            <>
              <dt>Phone</dt>
              <dd>
                <a href={`tel:${contact.phone.replace(/[^0-9+]/g, '')}`}>{contact.phone}</a>
              </dd>
            </>
          )}
          {contact.email && (
            <>
              <dt>Email</dt>
              <dd>
                <a href={`mailto:${contact.email}`}>{contact.email}</a>
              </dd>
            </>
          )}
          {contact.address && (
            <>
              <dt>Address</dt>
              <dd>{contact.address}</dd>
            </>
          )}
          {contact.notes && (
            <>
              <dt>Notes</dt>
              <dd>{contact.notes}</dd>
            </>
          )}
        </dl>
      </div>

      <div className="grid-4" style={{ marginBottom: 16 }}>
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="stat-num">{t.events}</div>
          <div className="stat-label">Events booked</div>
        </div>
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="stat-num money">{money(t.bookedValue)}</div>
          <div className="stat-label">Booked value</div>
        </div>
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="stat-num">{t.upcoming}</div>
          <div className="stat-label">Upcoming</div>
        </div>
        <div className="card" style={{ marginBottom: 0 }}>
          <div className={`stat-num money ${t.outstanding > 0 ? 'negative' : ''}`}>{money(t.outstanding)}</div>
          <div className="stat-label">Invoices outstanding</div>
        </div>
      </div>

      {linkedSeries.length > 0 && (
        <div className="card">
          <h2>Linked series</h2>
          {linkedSeries.map((s) => (
            <div key={s.id} className="list-row">
              <div className="list-main">
                <div className="list-title">{s.name}</div>
                <div className="list-sub">
                  {db.events.filter((e) => e.seriesId === s.id && e.contactId === contact.id).length} events
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h2>Event history</h2>
        {events.length === 0 ? (
          <EmptyState>No events with this client yet.</EmptyState>
        ) : (
          events.map((ev) => (
            <div key={ev.id} className="list-row clickable" onClick={() => openEvent(ev.id)}>
              <div className="list-main">
                <div className="list-title">{ev.title}</div>
                <div className="list-sub">
                  {fmtDate(ev.date)} · {ev.venue || 'No venue yet'}
                </div>
              </div>
              <span className="money">{money(ev.invoiceAmountCents)}</span>
            </div>
          ))
        )}
      </div>

      <div className="card">
        <h2>Invoices</h2>
        {invoices.length === 0 ? (
          <EmptyState>No invoices for this client yet.</EmptyState>
        ) : (
          invoices.map((inv) => (
            <div key={inv.id} className="list-row clickable" onClick={() => openInvoice(inv.id)}>
              <div className="list-main">
                <div className="list-title">{inv.number}</div>
                <div className="list-sub">
                  {inv.eventIds.length} {inv.eventIds.length === 1 ? 'event' : 'events'} · due {fmtDate(inv.dueDate)}
                </div>
              </div>
              <span className={`chip ${inv.status === 'paid' ? 'chip-green' : inv.status === 'sent' ? '' : 'chip-grey'}`}>
                {inv.status}
              </span>
              <span className="money">{money(invoiceTotal(db, inv))}</span>
            </div>
          ))
        )}
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title={`Delete ${contact.name}?`}
          body="The contact profile will be removed. Events and invoices that reference it will keep their records but lose the link."
          confirmLabel="Delete"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            update((d) => {
              d.contacts = d.contacts.filter((c) => c.id !== contact.id)
              d.events.forEach((e) => {
                if (e.contactId === contact.id) e.contactId = ''
              })
              d.invoices = d.invoices.filter((i) => i.contactId !== contact.id)
            })
            go('contacts')
          }}
        />
      )}
    </div>
  )
}
