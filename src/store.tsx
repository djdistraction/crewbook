// CrewBook app-level state: the DB (persisted to localStorage) plus routing.
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { DB, loadDB, saveDB } from './lib'

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
  const [db, setDb] = useState<DB>(() => loadDB())
  const [route, setRoute] = useState<Route>({ tab: 'board' })

  const update = useCallback((fn: (d: DB) => void) => {
    setDb((prev) => {
      const next: DB = JSON.parse(JSON.stringify(prev))
      fn(next)
      saveDB(next)
      return next
    })
  }, [])

  const replace = useCallback((next: DB) => {
    saveDB(next)
    setDb(next)
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

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
