// CrewBook Groups: band / duo / trio / group profiles with linked members.
import React, { useState } from 'react'
import { Group, fmtDate, groupEarned, money, uid } from '../lib'
import { useApp } from '../store'
import { Avatar, ConfirmDialog, EmptyState, Field, Modal, PhotoPicker, QualificationPicker } from '../ui'

const KINDS = ['Band', 'Duo', 'Trio', 'Group'] as const

export function Groups() {
  const { db, route, go } = useApp()
  const detail = route.detail

  if (detail?.kind === 'group') {
    if (detail.id === 'new') {
      return <GroupForm onDone={(id) => (id ? go('groups', { kind: 'group', id }) : go('groups'))} />
    }
    const group = db.groups.find((g) => g.id === detail.id)
    if (!group) return <EmptyState>That group no longer exists.</EmptyState>
    return <GroupProfile groupId={group.id} />
  }

  const sorted = [...db.groups].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div>
      <div className="page-head">
        <h1>Groups</h1>
        <p>Bands, duos, and acts booked as one.</p>
        <span style={{ marginLeft: 'auto' }}>
          <button className="btn btn-primary" onClick={() => go('groups', { kind: 'group', id: 'new' })}>
            Add group
          </button>
        </span>
      </div>
      {sorted.length === 0 ? (
        <div className="card">
          <EmptyState>
            No groups yet. Add a band, duo, or trio and link its members — booking the group then blocks its members,
            and booking a member solo blocks the group.
          </EmptyState>
        </div>
      ) : (
        <div className="card">
          {sorted.map((g) => (
            <div key={g.id} className="list-row clickable" onClick={() => go('groups', { kind: 'group', id: g.id })}>
              <Avatar name={g.name} photo={g.photo} size={42} />
              <div className="list-main">
                <div className="list-title">{g.name}</div>
                <div className="list-sub">
                  {g.kind} · {g.memberIds.map((id) => db.people.find((p) => p.id === id)?.name).filter(Boolean).join(', ') || 'No members yet'}
                </div>
              </div>
              {g.qualifications.map((q) => (
                <span key={q} className="chip">
                  {q}
                </span>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function GroupForm({ existing, onDone }: { existing?: Group; onDone: (id: string) => void }) {
  const { db, update } = useApp()
  const [name, setName] = useState(existing?.name ?? '')
  const [kind, setKind] = useState<(typeof KINDS)[number]>(existing?.kind ?? 'Band')
  const [photo, setPhoto] = useState<string | undefined>(existing?.photo)
  const [quals, setQuals] = useState<string[]>(existing?.qualifications ?? [])
  const [memberIds, setMemberIds] = useState<string[]>(existing?.memberIds ?? [])
  const [notes, setNotes] = useState(existing?.notes ?? '')

  const save = () => {
    if (!name.trim()) return
    let id = existing?.id ?? ''
    update((d) => {
      if (existing) {
        const g = d.groups.find((x) => x.id === existing.id)
        if (g) {
          g.name = name.trim()
          g.kind = kind
          g.photo = photo
          g.qualifications = quals
          g.memberIds = memberIds
          g.notes = notes.trim()
        }
        id = existing.id
      } else {
        const g: Group = {
          id: uid(),
          name: name.trim(),
          kind,
          photo,
          qualifications: quals,
          memberIds,
          notes: notes.trim(),
        }
        d.groups.push(g)
        id = g.id
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
    <Modal title={existing ? 'Edit group' : 'Add group'} onClose={() => onDone(existing?.id ?? '')}>
      <PhotoPicker photo={photo} onChange={setPhoto} label={name || 'New group'} />
      <Field label="Group name">
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="The Harbor Lights" />
      </Field>
      <Field label="Type">
        <select className="input" value={kind} onChange={(e) => setKind(e.target.value as never)}>
          {KINDS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Qualifications">
        <QualificationPicker all={db.qualifications} selected={quals} onChange={setQuals} onAddNew={addQualification} />
      </Field>
      <Field label="Members">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {db.people.map((p) => (
            <label key={p.id} className="row" style={{ gap: 6 }}>
              <input
                type="checkbox"
                checked={memberIds.includes(p.id)}
                onChange={() =>
                  setMemberIds(memberIds.includes(p.id) ? memberIds.filter((x) => x !== p.id) : [...memberIds, p.id])
                }
              />
              <span>
                {p.name} <span className="muted small">· {p.qualifications.join(', ')}</span>
              </span>
            </label>
          ))}
          {db.people.length === 0 && <span className="muted small">No crew yet — add people on the Crew tab first.</span>}
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
          {existing ? 'Save changes' : 'Add group'}
        </button>
      </div>
    </Modal>
  )
}

function GroupProfile({ groupId }: { groupId: string }) {
  const { db, update, go, openPerson, openEvent } = useApp()
  const group = db.groups.find((g) => g.id === groupId)
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!group) return <EmptyState>That group no longer exists.</EmptyState>
  if (editing) {
    return <GroupForm existing={group} onDone={() => setEditing(false)} />
  }

  const { earned, owed } = groupEarned(db, group.id)
  const history = db.assignments
    .filter((a) => a.groupId === group.id)
    .map((a) => ({ a, ev: db.events.find((e) => e.id === a.eventId) }))
    .sort((x, y) => (y.ev?.date ?? '').localeCompare(x.ev?.date ?? ''))
  const members = group.memberIds.map((id) => db.people.find((p) => p.id === id)).filter(Boolean)

  return (
    <div>
      <div className="page-head">
        <button className="btn btn-small" onClick={() => go('groups')}>
          ← Groups
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
          <Avatar name={group.name} photo={group.photo} size={72} />
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: '0 0 4px', fontSize: 22 }}>{group.name}</h1>
            <div className="row">
              <span className="chip chip-grey">{group.kind}</span>
              {group.qualifications.map((q) => (
                <span key={q} className="chip">
                  {q}
                </span>
              ))}
            </div>
          </div>
        </div>
        {group.notes && <p style={{ marginBottom: 0 }}>{group.notes}</p>}
      </div>

      <div className="card">
        <h2>Members</h2>
        {members.length === 0 ? (
          <EmptyState>No members linked yet.</EmptyState>
        ) : (
          members.map((m) => (
            <div key={m!.id} className="list-row clickable" onClick={() => openPerson(m!.id)}>
              <Avatar name={m!.name} photo={m!.photo} size={38} />
              <div className="list-main">
                <div className="list-title">{m!.name}</div>
                <div className="list-sub">{m!.qualifications.join(', ')}</div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="grid-3" style={{ marginBottom: 16 }}>
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="stat-num">{history.length}</div>
          <div className="stat-label">Gigs booked</div>
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
          title={`Delete ${group.name}?`}
          body="The group profile and its work history will be removed. Its members stay on the crew roster."
          confirmLabel="Delete"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            update((d) => {
              d.groups = d.groups.filter((g) => g.id !== group.id)
              d.assignments = d.assignments.filter((a) => a.groupId !== group.id)
            })
            go('groups')
          }}
        />
      )}
    </div>
  )
}
