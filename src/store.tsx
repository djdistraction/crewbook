// CrewBook app-level state: the DB (persisted to IndexedDB) plus routing.
import React, { createContext, useCallback, useContext, useMemo, useState, useEffect } from 'react'
import { DB, loadDB, saveDB, emptyDB } from './lib'

export type Tab =
  | 'board'
  | 'events'
  | 'calendar'
  | 'crew'
  | 'groups'
  | 'contacts'
  | 'invoices'
  | 'documents'

export type DrillKind = 'upcoming' | 'unfilled' | 'working' | 'awaiting'

export type Detail =
  | { kind: 'event'; id: string }
  | { kind: 'person'; id: string }
  | { kind: 'group'; id: string }
  | { kind: 'contact'; id: string }
  | { kind: 'invoice'; id: string }
  | { kind: 'drill'; drill: DrillKind }

export interface Route {
  tab: Tab
  detail?: Detail
}

interface AppCtx {
  db: DB
  update: (fn: (db: DB) => void) => void
  replace: (db: DB) => void
  route: Route
  go: (tab: Tab, detail?: Detail) => void
  openPerson: (id: string) => void
  openGroup: (id: string) => void
  openContact: (id: string) => void
  openEvent: (id: string) => void
  openInvoice: (id: string) => void
}

const Ctx = createContext<AppCtx | null>(null)

export function useApp(): AppCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApp outside provider')
  return ctx
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  // 1. Initialize with an empty database to satisfy TypeScript on first render
  const [db, setDb] = useState<DB>(emptyDB())
  const [route, setRoute] = useState<Route>({ tab: 'board' })
  
  // 2. Add a ready state to track when our background data fetch finishes
  const [isReady, setIsReady] = useState(false)

  // 3. Load the data asynchronously when the app opens
  useEffect(() => {
    async function init() {
      const data = await loadDB()
      setDb(data)
      setIsReady(true)
    }
    init()
  }, [])

  const update = useCallback((fn: (d: DB) => void) => {
    setDb((prev) => {
      const next: DB = JSON.parse(JSON.stringify(prev))
      fn(next)
      // saveDB is now an async function, so this fires in the background
      saveDB(next) 
      return next
    })
  }, [])

  const replace = useCallback((next: DB) => {
    setDb(next)
    // Fires in the background
    saveDB(next) 
  }, [])

  const go = useCallback((tab: Tab, detail?: Detail) => {
    setRoute({ tab, detail })
    window.scrollTo({ top: 0 })
  }, [])

  const value = useMemo<AppCtx>(
    () => ({
      db,
      update,
      replace,
      route,
      go,
      openPerson: (id) => go('crew', { kind: 'person', id }),
      openGroup: (id) => go('groups', { kind: 'group', id }),
      openContact: (id) => go('contacts', { kind: 'contact', id }),
      openEvent: (id) => go('events', { kind: 'event', id }),
      openInvoice: (id) => go('invoices', { kind: 'invoice', id }),
    }),
    [db, update, replace, route, go],
  )

  // 4. Pause the UI rendering until IndexedDB returns our data
  if (!isReady) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--dim)', fontSize: '1.2rem' }}>Loading CrewBook...</p>
      </div>
    )
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
