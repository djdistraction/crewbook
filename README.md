# CrewBook

**CrewBook is a staffing and booking dashboard for agencies and independent operators in the hospitality and entertainment industries.**

A client — a venue, an individual, or an organization — hires your company to staff an event. You invoice the client one amount for the whole event, and you pay each worker their own per-event offered pay. CrewBook keeps the roster, the money, and the paperwork in one place, and shows your profit on every event the moment you staff it.

> Example: a private party needs 3 waitstaff. The client pays $800. Each waitstaff is offered $200. CrewBook shows $600 in worker pay and $200 profit — before the event even happens.

---

## Who it's for

- **Staffing agencies** booking bartenders, barbacks, waitstaff, cooks, and stage hands across many venues
- **Entertainment bookers** placing DJs, karaoke hosts, bands, duos, and solo acts
- **Independent operators** running a small crew and invoicing clients themselves

If you hire people by the event and pay them by the event, CrewBook is built for you.

## Features

### Board
- Live stats — Upcoming events, Unfilled spots, Working, Awaiting payment — each labeled with its time period and tappable to open the exact list behind the number
- Time filter: This week / This month / This year / All time, applying to the whole board
- Awaiting payment section with Pay links and Mark paid buttons
- Your data panel: download a full backup, restore from a backup, load or clear sample data, erase and start over

### Events
- Create, edit, duplicate, and delete events with date, time, venue, client type, and linked contact
- Roles needed with counts, and per-assignment pay — so profit (invoice minus worker pay) is live on every event
- Recurring events: daily, weekly (pick the weekdays), or monthly, every 1–12 intervals, ending after a number of events or on a date, with a live preview of how many events will be created. A recurring run links itself into a series so it can be invoiced together
- Events link into named series so a multi-night run bills on one invoice
- Event detail pages where assigned crew names are tappable to open their profiles

### Calendar
- Month view with a staffing legend
- Fully staffed events show green with a check; events still needing crew show red with the open count; completed events and events with no roles show grey
- Tap any event to open it

### Crew
- Individual profiles with phone, email, notes, and a photo
- Qualifications picked from a multi-select dropdown — one person can hold several (Sound Tech *and* Lighting Tech) and cover several roles on one event
- Add your own qualifications; rename or remove them from the Manage list (each appears exactly once, with usage counts)
- Preferred payment method — Venmo, PayPal, Zelle, Cash App, Apple Pay, check, or cash — with a handle and an auto-built pay link
- Full work and pay history: every gig, its pay, paid/unpaid status, total earned, and amount still owed
- A "Member of" chip links a person to their group profile

### Groups
- Separate tab for bands, duos, trios, and groups, each with a photo, qualifications, and linked members
- Groups book onto events just like individuals
- Shared availability, both ways: booking a band makes its singer unavailable for a bartending gig that day, and booking the singer solo makes the band unavailable

### Contacts
- A client database: venues, individuals, and organizations, with contact person, phone, email, address, and notes
- Contact profiles with tap-to-call and email, totals (events booked, booked value, upcoming, invoices outstanding), linked series, invoices, and a complete event history where every event opens its detail page

### Invoices
- Generate for a single event or a whole series
- Numbered (INV-1001…), with bill-to details, per-event line items, total, due date, and draft / sent / paid status
- Your company header and payment terms on every invoice, plus a copyable text version

### Documents
- Printable sheets: daily, weekly, monthly, and yearly overviews; crew lists by qualification; a full crew directory; individual and group profiles with work and pay history; contacts; invoices; event sheets; and an awaiting-payment list
- Preview in the app and download as a printable page

### Roster
- On an event, each role's picker lists only crew and groups holding that exact qualification — a bartender slot shows bartenders, nobody else
- Qualified people who can't work that day show separately as Unavailable, with the reason

### Backup & restore
- Download backup saves one JSON file (`crewbook-backup-YYYY-MM-DD.json`) with everything — crew, groups, events, contacts, invoices, settings, your company profile, and photos and logo embedded
- Restore from backup shows what's in the file before replacing everything, and asks for confirmation (a restore can't be undone)

### Company profile
- Your company name, tagline, owner, contact details, logo, and payment terms
- A profile icon in the upper left opens your profile; "Edit profile & settings" opens the edit form
- Your company details head every invoice and document

## Screenshots

Screenshots live in `docs/screenshots/`:

| File | Shows |
| --- | --- |
| `docs/screenshots/board.png` | The Board with stats, awaiting payment, and the data panel |
| `docs/screenshots/event-detail.png` | An event with its roster, pay, and live profit |
| `docs/screenshots/calendar.png` | The month view with green/red staffing |
| `docs/screenshots/crew-profile.png` | A crew profile with payment method and work history |
| `docs/screenshots/invoice.png` | An invoice with company header and line items |

## Quick start

Requires Node.js 18 or newer.

```bash
npm install
npm run dev
```

Open the address shown in the terminal (usually <http://localhost:5173>).

To build a production bundle:

```bash
npm run build
npm run preview
```

## How data is stored

Everything is stored in your browser's local storage — there is no server, no account, and no data leaving your device. Your crew, events, contacts, invoices, and company profile live only in the browser you use.

Back up regularly from the Board: **Download backup** saves the whole book to one JSON file. To move to another browser or device, use **Restore from backup** with that file.

## Configuration

Set up your company from the profile icon in the upper left:

- Company name, tagline, and owner
- Phone, email, address, and website
- Logo (shown in the header, on invoices, and on documents)
- Payment terms (shown on invoices — "Net 14" by default)

Your details appear on every invoice and document automatically.

## Deployment

CrewBook is a static app — the production build in `dist/` is plain HTML, CSS, and JavaScript. Host it on any static host (Cloudflare Pages, Netlify, Vercel, GitHub Pages, or any web server) and open it in a browser. There is no backend to run.

Because data lives in the browser, each person who uses CrewBook keeps their own book on their own device. Use the backup file to move a book between devices.

## License

Proprietary. © HTXpunk LLC. All rights reserved. See [LICENSE](LICENSE).
