// CrewBook sample data. Every name, company, and venue here is fictional.
// Loading sample data never overwrites existing records.

import { DB, emptyDB, uid } from './lib'

function iso(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

/** Dates relative to "now" so the sample book always looks alive. */
function near(daysFromNow: number): string {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function sampleDB(): DB {
  const db = emptyDB()

  db.company = {
    name: 'Harborlight Event Staffing',
    tagline: 'Staffing & entertainment, done right.',
    owner: 'Alex Rivera',
    phone: '(555) 014-2200',
    email: 'bookings@harborlight.example',
    address: '214 Marina Blvd, Suite 8, Baytown, TX 77520',
    website: 'harborlight.example',
    paymentTerms: 'Net 14',
  }

  const p = (o: Partial<import('./lib').Person> & { name: string }) => ({
    id: uid(),
    phone: '',
    email: '',
    notes: '',
    photo: undefined,
    qualifications: [],
    paymentMethod: '' as const,
    paymentHandle: '',
    ...o,
  })

  const maya = p({ name: 'Maya Chen', phone: '(555) 101-0001', email: 'maya@example.com', qualifications: ['Bartender'], paymentMethod: 'Venmo', paymentHandle: 'maya-chen' })
  const jordan = p({ name: 'Jordan Ellis', phone: '(555) 101-0002', email: 'jordan@example.com', qualifications: ['Barback', 'Waitstaff'], paymentMethod: 'Cash App', paymentHandle: 'jordanellis' })
  const sam = p({ name: 'Sam Rivera', phone: '(555) 101-0003', email: 'sam@example.com', qualifications: ['Waitstaff'], paymentMethod: 'Zelle', paymentHandle: 'sam@example.com' })
  const alex = p({ name: 'Alex Morgan', phone: '(555) 101-0004', email: 'alex@example.com', qualifications: ['Cook'], paymentMethod: 'PayPal', paymentHandle: 'alexmorgan' })
  const casey = p({ name: 'Casey Brooks', phone: '(555) 101-0005', email: 'casey@example.com', qualifications: ['Stage Hand'], paymentMethod: 'Venmo', paymentHandle: 'casey-brooks' })
  const devon = p({ name: 'Devon Park', phone: '(555) 101-0006', email: 'devon@example.com', qualifications: ['DJ'], paymentMethod: 'Cash App', paymentHandle: 'devonpark' })
  const riley = p({ name: 'Riley Thompson', phone: '(555) 101-0007', email: 'riley@example.com', qualifications: ['Karaoke Host'], paymentMethod: 'Zelle', paymentHandle: 'riley@example.com' })
  const jamie = p({ name: 'Jamie Foster', phone: '(555) 101-0008', email: 'jamie@example.com', qualifications: ['Sound Tech', 'Lighting Tech'], paymentMethod: 'PayPal', paymentHandle: 'jamiefoster' })
  const taylor = p({ name: 'Taylor Nguyen', phone: '(555) 101-0009', email: 'taylor@example.com', qualifications: ['Waitstaff', 'Bartender'], paymentMethod: 'Venmo', paymentHandle: 'taylor-nguyen' })
  const drew = p({ name: 'Drew Callahan', phone: '(555) 101-0010', email: 'drew@example.com', qualifications: ['Solo Acoustic', 'Bartender'], paymentMethod: 'Venmo', paymentHandle: 'drewcallahan', notes: 'Lead singer of The Harbor Lights. Also takes bartending gigs.' })
  const harper = p({ name: 'Harper Lane', phone: '(555) 101-0011', email: 'harper@example.com', qualifications: ['Duo'], paymentMethod: 'Cash App', paymentHandle: 'harperlane' })
  const lane = p({ name: 'Lane Ortiz', phone: '(555) 101-0012', email: 'lane@example.com', qualifications: ['Duo', 'Solo Acoustic'], paymentMethod: 'Zelle', paymentHandle: 'lane@example.com' })
  const morgan = p({ name: 'Morgan Hale', phone: '(555) 101-0013', email: 'morgan@example.com', qualifications: ['Solo Acoustic'], paymentMethod: 'PayPal', paymentHandle: 'morganhale' })
  db.people = [maya, jordan, sam, alex, casey, devon, riley, jamie, taylor, drew, harper, lane, morgan]

  const harborLights = {
    id: uid(),
    name: 'The Harbor Lights',
    kind: 'Band' as const,
    qualifications: ['Full Band'],
    memberIds: [drew.id, morgan.id, jamie.id],
    notes: 'Four-piece cover band. Drew sings, Morgan plays guitar, Jamie runs sound.',
  }
  const harperLane = {
    id: uid(),
    name: 'Harper & Lane',
    kind: 'Duo' as const,
    qualifications: ['Duo'],
    memberIds: [harper.id, lane.id],
    notes: 'Acoustic duo — harmonies and guitar.',
  }
  db.groups = [harborLights, harperLane]

  const rallyVenue = { id: uid(), name: 'Desert Thunder Fairgrounds', type: 'Venue' as const, contactPerson: 'Pat Delgado', phone: '(555) 220-0001', email: 'events@desertthunder.example', address: '88 Fairgrounds Rd, Baytown, TX 77520', notes: 'Annual biker rally. Load-in at the north gate.' }
  const partyClient = { id: uid(), name: 'The Alvarez Family', type: 'Individual' as const, contactPerson: 'Maria Alvarez', phone: '(555) 220-0002', email: 'maria@example.com', address: '14 Palm Court, Baytown, TX 77520', notes: 'Private backyard party.' }
  const karaokeBar = { id: uid(), name: 'The Rusty Anchor', type: 'Venue' as const, contactPerson: 'Chris Delgado', phone: '(555) 220-0003', email: 'bookings@rustyanchor.example', address: '402 Harbor St, Baytown, TX 77520', notes: 'Friday karaoke nights, 9 pm – 1 am.' }
  const festivalOrg = { id: uid(), name: 'Baytown Arts Council', type: 'Organization' as const, contactPerson: 'Robin Vasquez', phone: '(555) 220-0004', email: 'festival@baytownarts.example', address: '1 Civic Plaza, Baytown, TX 77520', notes: 'Runs the Riverfront Music Fest each year.' }
  db.contacts = [rallyVenue, partyClient, karaokeBar, festivalOrg]

  const karaokeSeries = { id: uid(), name: 'Friday Karaoke Nights' }
  db.series = [karaokeSeries]

  const ev = (o: Partial<import('./lib').EventItem> & { title: string; date: string }) => ({
    id: uid(),
    startTime: '18:00',
    endTime: '23:00',
    venue: '',
    clientType: 'Venue' as const,
    contactId: '',
    invoiceAmountCents: 0,
    roles: [],
    notes: '',
    ...o,
  })

  const rally = ev({
    title: 'Desert Thunder Biker Rally',
    date: near(6),
    startTime: '09:00',
    endTime: '22:00',
    venue: 'Desert Thunder Fairgrounds',
    contactId: rallyVenue.id,
    invoiceAmountCents: 240000,
    roles: [{ id: uid(), qualification: 'Stage Hand', count: 4 }],
  })
  const party = ev({
    title: 'Alvarez Family Party',
    date: near(3),
    startTime: '18:00',
    endTime: '22:00',
    venue: 'The Alvarez Residence',
    clientType: 'Individual',
    contactId: partyClient.id,
    invoiceAmountCents: 80000,
    roles: [{ id: uid(), qualification: 'Waitstaff', count: 3 }],
  })
  const karaoke1 = ev({
    title: 'Friday Karaoke Night',
    date: near(4),
    startTime: '21:00',
    endTime: '01:00',
    venue: 'The Rusty Anchor',
    contactId: karaokeBar.id,
    invoiceAmountCents: 45000,
    seriesId: karaokeSeries.id,
    roles: [
      { id: uid(), qualification: 'Karaoke Host', count: 1 },
      { id: uid(), qualification: 'Bartender', count: 1 },
    ],
  })
  const karaoke2 = ev({
    title: 'Friday Karaoke Night',
    date: near(11),
    startTime: '21:00',
    endTime: '01:00',
    venue: 'The Rusty Anchor',
    contactId: karaokeBar.id,
    invoiceAmountCents: 45000,
    seriesId: karaokeSeries.id,
    roles: [
      { id: uid(), qualification: 'Karaoke Host', count: 1 },
      { id: uid(), qualification: 'Bartender', count: 1 },
    ],
  })
  const karaoke3 = ev({
    title: 'Friday Karaoke Night',
    date: near(18),
    startTime: '21:00',
    endTime: '01:00',
    venue: 'The Rusty Anchor',
    contactId: karaokeBar.id,
    invoiceAmountCents: 45000,
    seriesId: karaokeSeries.id,
    roles: [
      { id: uid(), qualification: 'Karaoke Host', count: 1 },
      { id: uid(), qualification: 'Bartender', count: 1 },
    ],
  })
  const festival = ev({
    title: 'Riverfront Music Fest',
    date: near(-10),
    startTime: '12:00',
    endTime: '23:00',
    venue: 'Riverfront Park',
    clientType: 'Organization',
    contactId: festivalOrg.id,
    invoiceAmountCents: 320000,
    roles: [
      { id: uid(), qualification: 'Stage Hand', count: 2 },
      { id: uid(), qualification: 'Sound Tech', count: 1 },
      { id: uid(), qualification: 'Full Band', count: 1 },
    ],
  })
  db.events = [rally, party, karaoke1, karaoke2, karaoke3, festival]

  const asg = (o: Partial<import('./lib').Assignment> & { eventId: string; qualification: string; payCents: number }) => ({
    id: uid(),
    paid: false,
    ...o,
  })
  db.assignments = [
    asg({ eventId: rally.id, personId: casey.id, qualification: 'Stage Hand', payCents: 30000, paid: false }),
    asg({ eventId: rally.id, personId: jamie.id, qualification: 'Stage Hand', payCents: 30000, paid: false }),
    asg({ eventId: party.id, personId: sam.id, qualification: 'Waitstaff', payCents: 20000, paid: false }),
    asg({ eventId: party.id, personId: jordan.id, qualification: 'Waitstaff', payCents: 20000, paid: false }),
    asg({ eventId: party.id, personId: taylor.id, qualification: 'Waitstaff', payCents: 20000, paid: false }),
    asg({ eventId: karaoke1.id, personId: riley.id, qualification: 'Karaoke Host', payCents: 15000, paid: false }),
    asg({ eventId: karaoke1.id, personId: maya.id, qualification: 'Bartender', payCents: 15000, paid: false }),
    asg({ eventId: festival.id, personId: casey.id, qualification: 'Stage Hand', payCents: 35000, paid: true }),
    asg({ eventId: festival.id, personId: jamie.id, qualification: 'Sound Tech', payCents: 40000, paid: true }),
    asg({ eventId: festival.id, groupId: harborLights.id, qualification: 'Full Band', payCents: 120000, paid: true }),
  ]

  db.invoices = [
    {
      id: uid(),
      number: 'INV-1001',
      contactId: partyClient.id,
      eventIds: [party.id],
      issueDate: near(-1),
      dueDate: near(13),
      status: 'sent',
      notes: '',
    },
    {
      id: uid(),
      number: 'INV-1002',
      contactId: karaokeBar.id,
      eventIds: [karaoke1.id, karaoke2.id, karaoke3.id],
      issueDate: near(-1),
      dueDate: near(13),
      status: 'draft',
      notes: 'Three-night karaoke series, invoiced together.',
    },
  ]
  db.nextInvoice = 1003
  db.seeded = true

  // keep the ISO helper referenced for future dated samples
  void iso

  return db
}
