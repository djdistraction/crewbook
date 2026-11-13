// CrewBook — data model, persistence, and helpers.
// All data lives in IndexedDB; no server is involved.

import { get, set } from 'idb-keyval'

export type PaymentMethod =
  | 'Venmo'
  | 'PayPal'
  | 'Zelle'
  | 'Cash App'
  | 'Apple Pay'
  | 'Check'
  | 'Cash'
  | ''

export const PAYMENT_METHODS: Exclude<PaymentMethod, ''>[] = [
  'Venmo',
  'PayPal',
  'Zelle',
  'Cash App',
  'Apple Pay',
  'Check',
  'Cash',
]

export interface Person {
  id: string
  name: string
  phone: string
  email: string
  notes: string
  photo?: string
  qualifications: string[]
  paymentMethod: PaymentMethod
  paymentHandle: string
}

export interface Group {
  id: string
  name: string
  kind: 'Band' | 'Duo' | 'Trio' | 'Group'
  photo?: string
  qualifications: string[]
  memberIds: string[]
  notes: string
}

export interface Contact {
  id: string
  name: string
  type: 'Venue' | 'Individual' | 'Organization'
  contactPerson: string
  phone: string
  email: string
  address: string
  notes: string
}

export interface EventRole {
  id: string
  qualification: string
  count: number
}

export interface EventItem {
  id: string
  title: string
  date: string // YYYY-MM-DD
  startTime: string
  endTime: string
  venue: string
  clientType: 'Venue' | 'Individual' | 'Organization'
  contactId: string
  invoiceAmountCents: number
  seriesId?: string
  roles: EventRole[]
  notes: string
}

export interface Assignment {
  id: string
  eventId: string
  personId?: string
  groupId?: string
  qualification: string
  payCents: number
  paid: boolean
}

export interface Series {
  id: string
  name: string
}

export interface Invoice {
  id: string
  number: string
  contactId: string
  eventIds: string[]
  issueDate: string
  dueDate: string
  status: 'draft' | 'sent' | 'paid'
  notes: string
}

export interface CompanyProfile {
  name: string
  tagline: string
  owner: string
  phone: string
  email: string
  address: string
  website: string
  paymentTerms: string
  logo?: string
}

export interface DB {
  version: number
  company: CompanyProfile
  people: Person[]
  groups: Group[]
  contacts: Contact[]
  events: EventItem[]
  assignments: Assignment[]
  series: Series[]
  invoices: Invoice[]
  qualifications: string[]
  nextInvoice: number
  seeded: boolean
}

export const DEFAULT_QUALIFICATIONS = [
  'Bartender',
  'Barback',
  'Waitstaff',
  'Cook',
  'Stage Hand',
  'DJ',
  'Karaoke Host',
  'Full Band',
  'Duo',
  'Solo Acoustic',
  'Comedian',
  'Magician',
  'Sound Tech',
  'Lighting Tech',
  'Cover Band',
]

export const STORAGE_KEY = 'crewbook-data-v1'

export function emptyDB(): DB {
  return {
    version: 1,
    company: {
      name: '',
      tagline: '',
      owner: '',
      phone: '',
      email: '',
      address: '',
      website: '',
      paymentTerms: 'Net 14',
    },
    people: [],
    groups: [],
    contacts: [],
    events: [],
    assignments: [],
    series: [],
    invoices: [],
    qualifications: [...DEFAULT_QUALIFICATIONS],
    nextInvoice: 1001,
    seeded: false,
  }
}

// -----------------------------------------
// NEW ASYNC DATABASE FUNCTIONS
// -----------------------------------------

export async function loadDB(): Promise<DB> {
  try {
    const raw = await get<DB>(STORAGE_KEY)
    if (!raw) return emptyDB()
    
    // Quick sanity check to ensure the object structure is generally correct
    if (!raw || typeof raw !== 'object' || !Array.isArray(raw.people)) {
        return emptyDB()
    }
    
    return { ...emptyDB(), ...raw }
  } catch (err) {
    console.error('Failed to load DB from IndexedDB:', err)
    return emptyDB()
  }
}

export async function saveDB(db: DB): Promise<void> {
  try {
    await set(STORAGE_KEY, db)
  } catch (err) {
    console.error('Failed to save DB to IndexedDB:', err)
  }
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

// ---------- formatting helpers ----------

export function money(cents: number): string {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export function dollarsToCents(input: string | number): number {
  const n = typeof input === 'number' ? input : parseFloat(String(input).replace(/[^0-9.]/g, ''))
  if (!isFinite(n)) return 0
  return Math.round(n * 100)
}

export function todayISO(): string {
  const d = new Date()
  return toISO(d)
}

export function toISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export function addDaysISO(s: string, n: number): string {
  const d = parseISO(s)
  d.setDate(d.getDate() + n)
  return toISO(d)
}

export function addMonthsISO(s: string, n: number): string {
  const d = parseISO(s)
  const day = d.getDate()
  d.setMonth(d.getMonth() + n)
  // clamp overflow (e.g. Jan 31 + 1mo -> Mar 3); keep it on the last day instead
  if (d.getDate() !== day) d.setDate(0)
  return toISO(d)
}

export function fmtDate(s: string): string {
  if (!s) return ''
  return parseISO(s).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function fmtDateShort(s: string): string {
  if (!s) return ''
  return parseISO(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function fmtTime(t: string): string {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hh = h % 12 === 0 ? 12 : h % 12
  return `${hh}:${String(m).padStart(2, '0')} ${ampm}`
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('')
}

export function payLink(method: PaymentMethod, handle: string): string | null {
  const h = handle.trim()
  if (!h) return null
  const clean = h.replace(/^@/, '')
  switch (method) {
    case 'Venmo':
      return `https://venmo.com/u/${encodeURIComponent(clean)}`
    case 'PayPal':
      return `https://paypal.me/${encodeURIComponent(clean)}`
    case 'Cash App':
      return `https://cash.app/$${encodeURIComponent(clean)}`
    case 'Zelle':
      return h.includes('@') ? `mailto:${h}` : `tel:${h.replace(/[^0-9+]/g, '')}`
    default:
      return null
  }
}

export function downloadFile(filename: string, content: string, mime = 'application/json') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// ---------- derived data ----------

export function eventAssignments(db: DB, eventId: string): Assignment[] {
  return db.assignments.filter((a) => a.eventId === eventId)
}

export function eventWorkerPay(db: DB, eventId: string): number {
  return eventAssignments(db, eventId).reduce((s, a) => s + a.payCents, 0)
}

export function eventProfit(db: DB, ev: EventItem): number {
  return ev.invoiceAmountCents - eventWorkerPay(db, ev.id)
}

export function eventNeeded(db: DB, ev: EventItem): number {
  return ev.roles.reduce((s, r) => s + r.count, 0)
}

export function eventFilled(db: DB, ev: EventItem): number {
  return eventAssignments(db, ev.id).length
}

export function eventUnfilled(db: DB, ev: EventItem): number {
  return Math.max(0, eventNeeded(db, ev) - eventFilled(db, ev))
}

export function eventIsPast(ev: EventItem): boolean {
  return ev.date < todayISO()
}

export function eventStaffingState(db: DB, ev: EventItem): 'staffed' | 'needs' | 'done' {
  if (eventIsPast(ev) || eventNeeded(db, ev) === 0) return 'done'
  return eventUnfilled(db, ev) === 0 ? 'staffed' : 'needs'
}

/** Dates on which a person is already booked (directly or through a group). */
export function personBookedDates(db: DB, personId: string): Set<string> {
  const dates = new Set<string>()
  for (const a of db.assignments) {
    const ev = db.events.find((e) => e.id === a.eventId)
    if (!ev) continue
    if (a.personId === personId) dates.add(ev.date)
    if (a.groupId) {
      const g = db.groups.find((x) => x.id === a.groupId)
      if (g && g.memberIds.includes(personId)) dates.add(ev.date)
    }
  }
  return dates
}

/** Dates on which a group is already booked (directly, or through any member). */
export function groupBookedDates(db: DB, groupId: string): Set<string> {
  const dates = new Set<string>()
  const g = db.groups.find((x) => x.id === groupId)
  if (!g) return dates
  for (const a of db.assignments) {
    const ev = db.events.find((e) => e.id === a.eventId)
    if (!ev) continue
    if (a.groupId === groupId) dates.add(ev.date)
    if (a.personId && g.memberIds.includes(a.personId)) dates.add(ev.date)
  }
  return dates
}

export function personEarned(db: DB, personId: string): { earned: number; owed: number } {
  let earned = 0
  let owed = 0
  for (const a of db.assignments) {
    if (a.personId !== personId) continue
    if (a.paid) earned += a.payCents
    else owed += a.payCents
  }
  return { earned, owed }
}

export function groupEarned(db: DB, groupId: string): { earned: number; owed: number } {
  let earned = 0
  let owed = 0
  for (const a of db.assignments) {
    if (a.groupId !== groupId) continue
    if (a.paid) earned += a.payCents
    else owed += a.payCents
  }
  return { earned, owed }
}

export function personGroups(db: DB, personId: string): Group[] {
  return db.groups.filter((g) => g.memberIds.includes(personId))
}

export function qualificationUsage(db: DB, q: string): number {
  const inPeople = db.people.filter((p) => p.qualifications.includes(q)).length
  const inGroups = db.groups.filter((g) => g.qualifications.includes(q)).length
  return inPeople + inGroups
}

export function invoiceTotal(db: DB, inv: Invoice): number {
  return inv.eventIds.reduce((s, id) => {
    const ev = db.events.find((e) => e.id === id)
    return s + (ev ? ev.invoiceAmountCents : 0)
  }, 0)
}

export function contactTotals(db: DB, contactId: string) {
  const events = db.events.filter((e) => e.contactId === contactId)
  const bookedValue = events.reduce((s, e) => s + e.invoiceAmountCents, 0)
  const upcoming = events.filter((e) => e.date >= todayISO()).length
  const invs = db.invoices.filter((i) => i.contactId === contactId)
  const outstanding = invs
    .filter((i) => i.status !== 'paid')
    .reduce((s, i) => s + invoiceTotal(db, i), 0)
  return { events: events.length, bookedValue, upcoming, invoices: invs.length, outstanding }
}

export type Period = 'week' | 'month' | 'year' | 'all'

export function periodRange(period: Period): { start: string; end: string } | null {
  const now = new Date()
  if (period === 'all') return null
  if (period === 'week') {
    const dow = now.getDay()
    const start = new Date(now)
    start.setDate(now.getDate() - dow) // Sunday
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return { start: toISO(start), end: toISO(end) }
  }
  if (period === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return { start: toISO(start), end: toISO(end) }
  }
  const start = new Date(now.getFullYear(), 0, 1)
  const end = new Date(now.getFullYear(), 11, 31)
  return { start: toISO(start), end: toISO(end) }
}

export function periodLabel(period: Period): string {
  switch (period) {
    case 'week':
      return 'this week'
    case 'month':
      return 'this month'
    case 'year':
      return 'this year'
    case 'all':
      return 'all time'
  }
}

export function inPeriod(date: string, period: Period): boolean {
  const r = periodRange(period)
  if (!r) return true
  return date >= r.start && date <= r.end
}

// ---------- recurrence ----------

export type RecurrenceFreq = 'daily' | 'weekly' | 'monthly'

export interface Recurrence {
  freq: RecurrenceFreq
  interval: number
  weekdays: number[] // 0 = Sunday .. 6 = Saturday (weekly only)
  endMode: 'count' | 'until'
  count: number
  until: string
}

export function recurrenceDates(start: string, r: Recurrence): string[] {
  const out: string[] = []
  const maxIter = 400
  if (r.freq === 'daily') {
    let d = start
    let n = 0
    while (n < maxIter) {
      if (r.endMode === 'count' && out.length >= r.count) break
      if (r.endMode === 'until' && d > r.until) break
      out.push(d)
      d = addDaysISO(d, r.interval)
      n++
    }
    return out
  }
  if (r.freq === 'monthly') {
    let d = start
    let n = 0
    while (n < maxIter) {
      if (r.endMode === 'count' && out.length >= r.count) break
      if (r.endMode === 'until' && d > r.until) break
      out.push(d)
      d = addMonthsISO(d, r.interval)
      n++
    }
    return out
  }
  // weekly
  const days = r.weekdays.length ? [...r.weekdays].sort((a, b) => a - b) : [parseISO(start).getDay()]
  let weekStart = parseISO(start)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  let n = 0
  while (n < maxIter) {
    for (const wd of days) {
      const d = new Date(weekStart)
      d.setDate(weekStart.getDate() + wd)
      const iso = toISO(d)
      if (iso < start) continue
      if (r.endMode === 'count' && out.length >= r.count) return out
      if (r.endMode === 'until' && iso > r.until) return out
      out.push(iso)
    }
    weekStart.setDate(weekStart.getDate() + 7 * r.interval)
    n++
  }
  return out
}

// ---------- invoice text ----------

export function invoiceText(db: DB, inv: Invoice): string {
  const c = db.company
  const contact = db.contacts.find((x) => x.id === inv.contactId)
  const lines: string[] = []
  lines.push(c.name || 'CrewBook')
  if (c.tagline) lines.push(c.tagline)
  if (c.owner) lines.push(`Owner: ${c.owner}`)
  if (c.phone) lines.push(`Phone: ${c.phone}`)
  if (c.email) lines.push(`Email: ${c.email}`)
  if (c.address) lines.push(c.address)
  if (c.website) lines.push(c.website)
  lines.push('')
  lines.push(`INVOICE ${inv.number}`)
  lines.push(`Date: ${fmtDate(inv.issueDate)}`)
  lines.push(`Due: ${fmtDate(inv.dueDate)}`)
  lines.push(`Status: ${inv.status.toUpperCase()}`)
  lines.push('')
  lines.push('BILL TO:')
  if (contact) {
    lines.push(contact.name)
    if (contact.contactPerson) lines.push(`Attn: ${contact.contactPerson}`)
    if (contact.address) lines.push(contact.address)
    if (contact.phone) lines.push(contact.phone)
    if (contact.email) lines.push(contact.email)
  }
  lines.push('')
  for (const id of inv.eventIds) {
    const ev = db.events.find((e) => e.id === id)
    if (!ev) continue
    lines.push(`${fmtDate(ev.date)}  ${ev.title} — ${money(ev.invoiceAmountCents)}`)
  }
  lines.push('')
  lines.push(`TOTAL DUE: ${money(invoiceTotal(db, inv))}`)
  if (c.paymentTerms) lines.push(`Terms: ${c.paymentTerms}`)
  if (inv.notes) lines.push(`Notes: ${inv.notes}`)
  return lines.join('\n')
}
