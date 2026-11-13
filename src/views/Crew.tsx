// CrewBook Crew: individual profiles, qualifications manager, work/pay history.
import React, { useMemo, useState } from 'react'
import {
  PaymentMethod,
  PAYMENT_METHODS,
  fmtDate,
  money,
  payLink,
  personEarned,
  personGroups,
  qualificationUsage,
  uid,
} from '../lib'
import { useApp } from '../store'
import { Avatar, Chip, ConfirmDialog, EmptyState, Field, Modal, PhotoPicker, QualificationPicker } from '../ui'

export function Crew() {
  const { db, route, go } = useApp()
  const detail = route.detail
  const [filterQ, setFilterQ] = useState('')
  const [manageOpen, setManageOpen] = useState(false)

  if (detail?.kind === 'person') {
    if (detail.id === 'new') {
      return <PersonForm onDone={(id) => (id ? go('crew', { kind: 'person', id }) : go('crew'))} />
    }
    const person = db.people.find((p) => p.id === detail.id)
    if (!person) return <EmptyState>That crew member no longer exists.</EmptyState>
    return <PersonProfile personId={person.id} />
  }

  const filtered = db.people.filter((p) => !filterQ || p.qualifications.includes(filterQ))
  const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div>
      <div className="page-head">
        <h1>Crew</h1>
        <p>{db.people.length} people on the roster.</p>
        <span style={{ marginLeft: 'auto' }} className="row">
          <select className="input" style={{ width: 200 }} value={filterQ} onChange={(e) => setFilterQ(e.target.value)}>
            <option value="">All qualifications</option>
            {db.qualifications.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>
          <button className="btn" onClick={() => setManageOpen(true)}>
            Manage list
          </button>
          <button className="btn btn-primary" onClick={() => go('crew', { kind: 'person', id: 'new' })}>
            Add crew
          </button>
        </span>
      </div>

      {sorted.length === 0 ? (
        <div className="card">
          <EmptyState>No crew members match.</EmptyState>
        </div>
      ) : (
        <div className="card">
          {sorted.map((p) => (
            <div key={p.id} className="list-row clickable" onClick={() => go('crew', { kind: 'person', id: p.id })}>
              <Avatar name={p.name} photo={p.photo} size={42} />
              <div className="list-main">
                <div className="list-title">{p.name}</div>
                <div className="list-sub">
                  {p.qualifications.join(', ') || 'No qualifications yet'}
                  {p.phone ? ` · ${p.phone}` : ''}
                </div>
              </div>
              {personGroups(db, p.id).map((g) => (
                <span key={g.id} className="chip">
                  Member of {g.name}
                </span>
              ))}
            </div>
          ))}
        </div>
      )}

      {manageOpen && <QualificationManager onClose={() => setManageOpen(false)} />}
    </div>
  )
}

function QualificationManager({ onClose }: { onClose: () => void }) {
  const { db, update } = useApp()
  const [newName, setNewName] = useState('')
  const [renaming, setRenaming] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)

  // dedupe defensively: each qualification appears exactly once
  const quals = useMemo(() => [...new Set(db.qualifications)], [db.qualifications])

  const add = () => {
    const name = newName.trim()
    if (!name || quals.some((q) => q.toLowerCase() === name.toLowerCase())) return
    update((d) => {
      if (!d.qualifications.includes(name)) d.qualifications.push(name)
    })
    setNewName('')
  }

  const rename = (oldName: string) => {
    const name = renameValue.trim()
    if (!name || name === oldName) return
    update((d) => {
      d.qualifications = d.qualifications.map((q) => (q === oldName ? name : q))
      d.people.forEach((p) => {
        p.qualifications = p.qualifications.map((q) => (q === oldName ? name : q))
      })
      d.groups.forEach((g) => {
        g.qualifications = g.qualifications.map((q) => (q === oldName ? name : q))
      })
      d.events.forEach((e) => {
        e.roles.forEach((r) => {
          if (r.qualification === oldName) r.qualification = name
        })
      })
      d.assignments.forEach((a) => {
        if (a.qualification === oldName) a.qualification = name
      })
    })
    setRenaming(null)
  }

  const remove = (name: string) => {
    update((d) => {
      d.qualifications = d.qualifications.filter((q) => q !== name)
      d.people.forEach((p) => {
        p.qualifications = p.qualifications.filter((q) => q !== name)
      })
      d.groups.forEach((g) => {
        g.qualifications = g.qualifications.filter((q) => q !== name)
      })
    })
    setConfirmRemove(null)
  }

  return (
    <Modal title="Manage qualifications" onClose={onClose}>
      <div className="row" style={{ marginBottom: 12 }}>
        <input
          className="input"
          style={{ flex: 1 }}
          value={newName}
          placeholder="Add a qualification"
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <button className="btn btn-primary" disabled={!newName.trim()} onClick={add}>
          Add
        </button>
      </div>
      {quals.map((q) => (
        <div key={q} className="list-row">
          <div className="list-main">
            {renaming === q ? (
              <input
                className="input"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && rename(q)}
              />
            ) : (
              <div className="list-title">{q}</div>
            )}
            <div className="list-sub">
              {qualificationUsage(db, q)} {qualificationUsage(db, q) === 1 ? 'profile' : 'profiles'} hold this
            </div>
          </div>
          {renaming === q ? (
            <>
              <button className="btn btn-small btn-primary" onClick={() => rename(q)}>
                Save
              </button>
              <button className="btn btn-small" onClick={() => setRenaming(null)}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-small"
                onClick={() => {
                  setRenaming(q)
                  setRenameValue(q)
                }}
              >
                Rename
              </button>
              <button className="btn btn-small btn-ghost" onClick={() => setConfirmRemove(q)}>
                Remove
              </button>
            </>
          )}
        </div>
      ))}
      {confirmRemove && (
        <ConfirmDialog
          title={`Remove "${confirmRemove}"?`}
          body="It will be taken off every profile that holds it. This cannot be undone."
          confirmLabel="Remove"
          onCancel={() => setConfirmRemove(null)}
          onConfirm={() => remove(confirmRemove)}
        />
      )}
    </Modal>
  )
}

export function PersonForm({
  existing,
  onDone,
}: {
  existing?: import('../lib').Person
  onDone: (id: string) => void
}) {
  const { db, update } = useApp()
  const [name, setName] = useState(existing?.name ?? '')
  const [phone, setPhone] = useState(existing?.phone ?? '')
  const [email, setEmail] = useState(existing?.email ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [photo, setPhoto] = useState<string | undefined>(existing?.photo)
  const [quals, setQuals] = useState<string[]>(existing?.qualifications ?? [])
  const [method, setMethod] = useState<PaymentMethod>(existing?.paymentMethod ?? '')
  const [handle, setHandle] = useState(existing?.paymentHandle ?? '')
  const [groupIds, setGroupIds] = useState<string[]>(
    existing ? db.groups.filter((g) => g.memberIds.includes(existing.id)).map((g) => g.id) : [],
  )

  const save = () => {
    if (!name.trim()) return
    let id = existing?.id ?? ''
    update((d) => {
      if (existing) {
        const p = d.people.find((x) => x.id === existing.id)
        if (p) {
          p.name = name.trim()
          p.phone = phone.trim()
          p.email = email.trim()
          p.notes = notes.trim()
          p.photo = photo
          p.qualifications = quals
          p.paymentMethod = method
          p.paymentHandle = handle.trim()
        }
        d.groups.forEach((g) => {
          const inGroup = groupIds.includes(g.id)
          if (inGroup && !g.memberIds.includes(existing.id)) g.memberIds.push(existing.id)
          if (!inGroup) g.memberIds = g.memberIds.filter((x) => x !== existing.id)
        })
        id = existing.id
      } else {
        const p = {
          id: uid(),
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          notes: notes.trim(),
          photo,
          qualifications: quals,
          paymentMethod: method,
          paymentHandle: handle.trim(),
        }
        d.people.push(p)
        d.groups.forEach((g) => {
          if (groupIds.includes(g.id)) g.memberIds.push(p.id)
        })
        id = p.id
      }
    })
    onDone(id)
  }

  const addQualification = (q: string) => {
    update((d) => {
      if (!d.qualifications.some((x) => x.toLowerCase() === q.toLowerCase())) d.qualifications.push(q)
    })
    setQuals((prev) => (prev.includes(q) ? prev : [...prev, q]))
  }

  return (
    <Modal title={existing ? 'Edit crew member' : 'Add crew member'} onClose={() => onDone(existing?.id ?? '')}>
      <PhotoPicker photo={photo} onChange={setPhoto} label={name || 'New crew member'} />
      <Field label="Name">
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
      </Field>
      <div className="grid-2">
        <Field label="Phone">
          <input className="input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label="Email">
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
      </div>
      <Field label="Qualifications">
        <QualificationPicker all={db.qualifications} selected={quals} onChange={setQuals} onAddNew={addQualification} />
      </Field>
      <div className="grid-2">
        <Field label="Preferred payment method">
          <select className="input" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
            <option value="">— None —</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Payment handle">
          <input className="input" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@username, email, or phone" />
        </Field>
      </div>
      <Field label="Member of a group">
        <div className="row">
          {db.groups.map((g) => (
            <label key={g.id} className="row" style={{ gap: 4 }}>
              <input
                type="checkbox"
                checked={groupIds.includes(g.id)}
                onChange={() =>
                  setGroupIds(groupIds.includes(g.id) ? groupIds.filter((x) => x !== g.id) : [...groupIds, g.id])
                }
              />
              {g.name}
            </label>
          ))}
          {db.groups.length === 0 && <span className="muted small">No groups yet — create one on the Groups tab.</span>}
        </div>
      </Field>
      <Field label="Notes">
        <textarea className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <button className="btn" onClick={() => onDone(existing?.id ?? '')}>
          Cancel
        </button>
        <button className="btn btn-primary" disabled={!name.trim()} onClick={save}>
          {existing ? 'Save changes' : 'Add crew member'}
        </button>
      </div>
    </Modal>
  )
}

function PersonProfile({ personId }: { personId: string }) {
  const { db, update, go, openGroup, openEvent } = useApp()
  const person = db.people.find((p) => p.id === personId)
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!person) return <EmptyState>That crew member no longer exists.</EmptyState>
  if (editing) {
    return <PersonForm existing={person} onDone={() => setEditing(false)} />
  }

  const { earned, owed } = personEarned(db, person.id)
  const history = db.assignments
    .filter((a) => a.personId === person.id)
    .map((a) => ({ a, ev: db.events.find((e) => e.id === a.eventId) }))
    .sort((x, y) => (y.ev?.date ?? '').localeCompare(x.ev?.date ?? ''))
  const groups = personGroups(db, person.id)
  const link = payLink(person.paymentMethod, person.paymentHandle)

  return (
    <div>
      <div className="page-head">
        <button className="btn btn-small" onClick={() => go('crew')}>
          ← Crew
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
        <div className="row" style={{ alignItems: 'flex-start' }}>
          <Avatar name={person.name} photo={person.photo} size={72} />
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: '0 0 4px', fontSize: 22 }}>{person.name}</h1>
            <div className="row">
              {person.qualifications.map((q) => (
                <span key={q} className="chip">
                  {q}
                </span>
              ))}
              {person.qualifications.length === 0 && <span className="muted small">No qualifications yet.</span>}
            </div>
            <div className="row" style={{ marginTop: 8 }}>
              {groups.map((g) => (
                <Chip key={g.id} onClick={() => openGroup(g.id)}>
                  Member of {g.name} →
                </Chip>
              ))}
            </div>
          </div>
        </div>
        <dl className="kv" style={{ marginTop: 16 }}>
          {person.phone && (
            <>
              <dt>Phone</dt>
              <dd>
                <a href={`tel:${person.phone.replace(/[^0-9+]/g, '')}`}>{person.phone}</a>
              </dd>
            </>
          )}
          {person.email && (
            <>
              <dt>Email</dt>
              <dd>
                <a href={`mailto:${person.email}`}>{person.email}</a>
              </dd>
            </>
          )}
          <dt>Preferred payment</dt>
          <dd>
            {person.paymentMethod ? (
              <>
                {person.paymentMethod}
                {person.paymentHandle ? ` · ${person.paymentHandle}` : ''}
                {link && (
                  <>
                    {' '}
                    · <a href={link} target="_blank" rel="noreferrer">Pay {person.name.split(' ')[0]}</a>
                  </>
                )}
              </>
            ) : (
              '—'
            )}
          </dd>
          {person.notes && (
            <>
              <dt>Notes</dt>
              <dd>{person.notes}</dd>
            </>
          )}
        </dl>
      </div>

      <div className="grid-3" style={{ marginBottom: 16 }}>
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="stat-num">{history.length}</div>
          <div className="stat-label">Gigs worked</div>
        </div>
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="stat-num money">{money(earned)}</div>
          <div className="stat-label">Total earned</div>
        </div>
        <div className="card" style={{ marginBottom: 0 }}>
          <div className={`stat-num money ${owed > 0 ? 'negative' : ''}`}>{money(owed)}</div>
          <div className="stat-label">Still owed</div>
        </div>
      </div>

      <div className="card">
        <h2>Work &amp; pay history</h2>
        {history.length === 0 ? (
          <EmptyState>No gigs yet.</EmptyState>
        ) : (
          history.map(({ a, ev }) => (
            <div key={a.id} className="list-row">
              <div className="list-main">
                <div className="list-title">
                  {ev ? (
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        openEvent(ev.id)
                      }}
                    >
                      {ev.title}
                    </a>
                  ) : (
                    'Event removed'
                  )}
                </div>
                <div className="list-sub">
                  {ev ? fmtDate(ev.date) : ''} · {a.qualification}
                </div>
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
            </div>
          ))
        )}
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title={`Delete ${person.name}?`}
          body="Their profile and work history will be removed. Their past event assignments will be unassigned."
          confirmLabel="Delete"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            update((d) => {
              d.people = d.people.filter((p) => p.id !== person.id)
              d.groups.forEach((g) => {
                g.memberIds = g.memberIds.filter((x) => x !== person.id)
              })
              d.assignments = d.assignments.filter((a) => a.personId !== person.id)
            })
            go('crew')
          }}
        />
      )}
    </div>
  )
}
