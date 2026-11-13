// CrewBook shared UI pieces.
import React, { useRef, useState } from 'react'
import { initials } from './lib'

export function Avatar({
  name,
  photo,
  size = 40,
}: {
  name: string
  photo?: string
  size?: number
}) {
  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
          border: '1px solid #cbd5e1',
        }}
      />
    )
  }
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: '#186a8a',
        color: '#fff',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: size * 0.36,
        flexShrink: 0,
      }}
    >
      {initials(name)}
    </span>
  )
}

export function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
  wide?: boolean
}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        style={{ maxWidth: wide ? 860 : 560 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={title}
      >
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string
  body: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p style={{ marginTop: 0 }}>{body}</p>
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <button className="btn" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn btn-danger" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}

/** Multi-select dropdown with checkboxes. */
export function QualificationPicker({
  all,
  selected,
  onChange,
  onAddNew,
}: {
  all: string[]
  selected: string[]
  onChange: (next: string[]) => void
  onAddNew?: (name: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const toggle = (q: string) => {
    onChange(selected.includes(q) ? selected.filter((x) => x !== q) : [...selected, q])
  }

  const label =
    selected.length === 0
      ? 'Select qualifications'
      : selected.length <= 2
        ? selected.join(', ')
        : `${selected.slice(0, 2).join(', ')} +${selected.length - 2} more`

  return (
    <div className="qual-picker" ref={ref}>
      <button type="button" className="input qual-picker-btn" onClick={() => setOpen((v) => !v)}>
        <span>{label}</span>
        <span aria-hidden>▾</span>
      </button>
      {open && (
        <div className="qual-picker-menu">
          {all.map((q) => (
            <label key={q} className="qual-picker-item">
              <input type="checkbox" checked={selected.includes(q)} onChange={() => toggle(q)} />
              <span>{q}</span>
            </label>
          ))}
          {onAddNew && (
            <div className="qual-picker-add">
              <input
                className="input"
                value={newName}
                placeholder="Add a qualification"
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newName.trim()) {
                    e.preventDefault()
                    onAddNew(newName.trim())
                    setNewName('')
                  }
                }}
              />
              <button
                type="button"
                className="btn btn-small"
                disabled={!newName.trim()}
                onClick={() => {
                  onAddNew(newName.trim())
                  setNewName('')
                }}
              >
                Add
              </button>
            </div>
          )}
          <button type="button" className="btn btn-small" onClick={() => setOpen(false)}>
            Done
          </button>
        </div>
      )}
    </div>
  )
}

/** Photo picker that stores the image as a data URL. */
export function PhotoPicker({
  photo,
  onChange,
  label,
}: {
  photo?: string
  onChange: (dataUrl: string | undefined) => void
  label: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div className="photo-picker">
      <Avatar name={label} photo={photo} size={72} />
      <div className="row">
        <button type="button" className="btn btn-small" onClick={() => inputRef.current?.click()}>
          {photo ? 'Change photo' : 'Add photo'}
        </button>
        {photo && (
          <button type="button" className="btn btn-small btn-ghost" onClick={() => onChange(undefined)}>
            Remove
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (!f) return
          const reader = new FileReader()
          reader.onload = () => onChange(String(reader.result))
          reader.readAsDataURL(f)
          e.target.value = ''
        }}
      />
    </div>
  )
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
    </label>
  )
}

export function Chip({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <span className="chip" onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}>
      {children}
    </span>
  )
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="empty-state">{children}</div>
}
