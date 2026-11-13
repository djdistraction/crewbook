// CrewBook company profile: view first, edit form behind "Edit profile & settings".
import React, { useState } from 'react'
import { CompanyProfile } from '../lib'
import { useApp } from '../store'
import { Avatar, Field, Modal, PhotoPicker } from '../ui'

export function CompanyProfileView() {
  const { db } = useApp()
  const [editing, setEditing] = useState(false)
  const c = db.company
  const hasProfile = Boolean(c.name || c.owner)

  if (editing || !hasProfile) {
    return <CompanyProfileForm existing={c} onDone={() => setEditing(false)} />
  }

  return (
    <div className="card">
      <div className="row" style={{ alignItems: 'flex-start' }}>
        {c.logo ? (
          <img src={c.logo} alt={c.name} style={{ width: 72, height: 72, objectFit: 'contain', borderRadius: 8, border: '1px solid var(--border)' }} />
        ) : (
          <Avatar name={c.name || 'Company'} size={72} />
        )}
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: '0 0 4px', fontSize: 22 }}>{c.name}</h1>
          {c.tagline && <p className="muted" style={{ margin: '0 0 8px' }}>{c.tagline}</p>}
        </div>
      </div>
      <dl className="kv" style={{ marginTop: 16 }}>
        {c.owner && (
          <>
            <dt>Owner</dt>
            <dd>{c.owner}</dd>
          </>
        )}
        {c.phone && (
          <>
            <dt>Phone</dt>
            <dd>
              <a href={`tel:${c.phone.replace(/[^0-9+]/g, '')}`}>{c.phone}</a>
            </dd>
          </>
        )}
        {c.email && (
          <>
            <dt>Email</dt>
            <dd>
              <a href={`mailto:${c.email}`}>{c.email}</a>
            </dd>
          </>
        )}
        {c.address && (
          <>
            <dt>Address</dt>
            <dd>{c.address}</dd>
          </>
        )}
        {c.website && (
          <>
            <dt>Website</dt>
            <dd>
              <a href={c.website.startsWith('http') ? c.website : `https://${c.website}`} target="_blank" rel="noreferrer">
                {c.website}
              </a>
            </dd>
          </>
        )}
        <dt>Payment terms</dt>
        <dd>{c.paymentTerms || '—'}</dd>
      </dl>
      <div className="row" style={{ marginTop: 12 }}>
        <button className="btn btn-primary" onClick={() => setEditing(true)}>
          Edit profile &amp; settings
        </button>
      </div>
    </div>
  )
}

export function CompanyProfileForm({ existing, onDone }: { existing: CompanyProfile; onDone: () => void }) {
  const { update } = useApp()
  const [name, setName] = useState(existing.name)
  const [tagline, setTagline] = useState(existing.tagline)
  const [owner, setOwner] = useState(existing.owner)
  const [phone, setPhone] = useState(existing.phone)
  const [email, setEmail] = useState(existing.email)
  const [address, setAddress] = useState(existing.address)
  const [website, setWebsite] = useState(existing.website)
  const [paymentTerms, setPaymentTerms] = useState(existing.paymentTerms)
  const [logo, setLogo] = useState<string | undefined>(existing.logo)

  const save = () => {
    update((d) => {
      d.company = {
        name: name.trim(),
        tagline: tagline.trim(),
        owner: owner.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        website: website.trim(),
        paymentTerms: paymentTerms.trim() || 'Net 14',
        logo,
      }
    })
    onDone()
  }

  return (
    <Modal title="Company profile" onClose={onDone}>
      <PhotoPicker photo={logo} onChange={setLogo} label={name || 'Company'} />
      <Field label="Company name">
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your company name" />
      </Field>
      <Field label="Tagline">
        <input className="input" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Staffing & entertainment, done right." />
      </Field>
      <Field label="Owner">
        <input className="input" value={owner} onChange={(e) => setOwner(e.target.value)} />
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
      <Field label="Website">
        <input className="input" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="example.com" />
      </Field>
      <Field label="Payment terms">
        <input className="input" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="Net 14" />
      </Field>
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <button className="btn" onClick={onDone}>
          Back to profile
        </button>
        <button className="btn btn-primary" onClick={save}>
          Save profile
        </button>
      </div>
    </Modal>
  )
}

export const PRIVACY_POLICY = `Privacy Policy

CrewBook stores all of your business data on your own device, in your browser's local storage. Your crew, events, contacts, invoices, and company profile never leave your device unless you choose to download a backup file or share it yourself.

CrewBook does not collect, transmit, or sell any personal information. There are no accounts, no tracking, and no third-party analytics built into the app.

Backup files you download contain your full business data, including photos. Keep them somewhere safe and do not share them with anyone who should not see your book.

If you have questions about this policy, contact the company using the details shown in the company profile.`

export const TERMS_OF_SERVICE = `Terms of Service

CrewBook is a staffing and booking dashboard provided by HTXpunk LLC. It is licensed for use by the business that purchased it.

You are responsible for the accuracy of the information you enter, including event details, pay rates, and invoice amounts. CrewBook calculates profit and totals from the figures you provide.

CrewBook is provided as-is. HTXpunk LLC is not liable for lost data, missed bookings, or payment disputes arising from use of the app. Download a backup regularly — your data lives in your browser, and clearing your browser data without a backup will remove it.

All rights reserved.`
