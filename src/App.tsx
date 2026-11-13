// CrewBook app shell: header with profile icon, tabs, footer.
import React, { useState } from 'react'
import { AppProvider, Tab, useApp } from './store'
import { Board } from './views/Board'
import { Events } from './views/Events'
import { Calendar } from './views/Calendar'
import { Crew } from './views/Crew'
import { Groups } from './views/Groups'
import { Contacts } from './views/Contacts'
import { Invoices } from './views/Invoices'
import { Documents } from './views/Documents'
import { CompanyProfileView, PRIVACY_POLICY, TERMS_OF_SERVICE } from './views/Profile'
import { Avatar, Modal } from './ui'

const TABS: { id: Tab; label: string }[] = [
  { id: 'board', label: 'Board' },
  { id: 'events', label: 'Events' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'crew', label: 'Crew' },
  { id: 'groups', label: 'Groups' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'documents', label: 'Documents' },
]

function Shell() {
  const { db, route, go } = useApp()
  const [profileOpen, setProfileOpen] = useState(false)
  const [legal, setLegal] = useState<'privacy' | 'terms' | null>(null)

  const companyName = db.company.name || 'CrewBook'

  return (
    <div className="app">
      <header className="app-header">
        <button
          className="profile-btn"
          aria-label="Open your profile"
          title="Your profile"
          onClick={() => setProfileOpen(true)}
        >
          {db.company.logo ? (
            <img
              src={db.company.logo}
              alt=""
              style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }}
            />
          ) : (
            <Avatar name={companyName} size={44} />
          )}
        </button>
        <div className="brand">
          <span className="brand-name">
            Crew<span>Book</span>
          </span>
          <span className="brand-sub">{companyName}</span>
        </div>
        <nav className="nav" aria-label="Main">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={route.tab === t.id ? 'active' : ''}
              onClick={() => go(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="main">
        {route.tab === 'board' && <Board />}
        {route.tab === 'events' && <Events />}
        {route.tab === 'calendar' && <Calendar />}
        {route.tab === 'crew' && <Crew />}
        {route.tab === 'groups' && <Groups />}
        {route.tab === 'contacts' && <Contacts />}
        {route.tab === 'invoices' && <Invoices />}
        {route.tab === 'documents' && <Documents />}
      </main>

      <footer className="app-footer">
        <span>© HTXpunk LLC. All rights reserved.</span>
        <span className="row">
          <button onClick={() => setLegal('privacy')}>Privacy Policy</button>
          <span>·</span>
          <button onClick={() => setLegal('terms')}>Terms of Service</button>
        </span>
      </footer>

      {profileOpen && (
        <Modal title="Your profile" onClose={() => setProfileOpen(false)} wide>
          <CompanyProfileView />
        </Modal>
      )}

      {legal && (
        <Modal
          title={legal === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
          onClose={() => setLegal(null)}
        >
          <pre className="plain">{legal === 'privacy' ? PRIVACY_POLICY : TERMS_OF_SERVICE}</pre>
        </Modal>
      )}
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}
