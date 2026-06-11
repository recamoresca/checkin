# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Relais Casa Moresca** — a boutique hospitality management system for a resort in Porto Badino, Terracina (Lazio, Italy). Three self-contained single-page HTML applications with no build step.

## Running Locally

No build process. Serve the files directly:

```bash
python3 -m http.server 8000
# then open http://localhost:8000/app-checkin.html
```

## Architecture

Three fully independent, single-file HTML applications. Each file contains all HTML, CSS, and JavaScript inline. No shared files, no imports, no build step.

| File | Purpose |
|------|---------|
| `app-checkin.html` | Core check-in management, guest registration, NFC/OCR document scanning, admin dashboard |
| `app-firma-ipad.html` | iPad-optimized digital signature capture, PDF generation, email delivery |
| `app-infoguests.html` | Static multilingual (IT/EN/DE) guest guide with accordion UI |

### Backend / Data Layer

- **Cloudflare Worker** at `https://red-resonance-d4ba.bnbcasamoresca.workers.dev` provides `/load?key=*` and `/save` (POST JSON) endpoints backed by Cloudflare KV namespace **`CM_DATA`**.
- **LocalStorage** is the primary offline store; KV is synced on load/save via `kvLoad()`/`kvSave()`.
- KV keys: `rcm_bk26` (bookings), `rcm_pren26` (reservations), `rcm_dn26` (completed check-ins), `rcm_season26` (season dashboard), `firma_session` (signature handoff between checkin → firma app).

### Cross-App Data Flow

1. `app-checkin.html` collects guest data and triggers `sendToIPad()`, which writes `firma_session` to KV.
2. `app-firma-ipad.html` reads `firma_session` from KV, captures two signatures (contract + privacy), generates PDFs client-side (jsPDF), and emails them to the guest via EmailJS.
3. `app-infoguests.html` is standalone — no backend, no state.

### External Services (CDN / API)

- **EmailJS v4** — client-side email sending. Service ID: `service_tsjwj0q`. Public key embedded in HTML (intentional for EmailJS client usage). SendGrid sender address: `info@bnbcasamoresca.com`.
- **jsPDF 2.5.1** — PDF generation, only in `app-firma-ipad.html`.
- **Google Fonts** — Raleway (UI) and Cormorant Garamond (legal documents).
- Web NFC API (`NDEFReader`) and MediaDevices (camera OCR) used in `app-checkin.html`.

### Design System

CSS custom properties defined at `:root`. Key tokens:
- `--olive: #5C7A52` — primary action color
- `--gold: #B8943F` — secondary accent
- `--arch: #3D3228` — dark brown headers
- `--calce: #F8F5F0` — cream background
- Body font: Raleway; legal/contract text: Cormorant Garamond

### PIN Protection

Dashboard and destructive operations (edit/delete bookings) are PIN-protected in `app-checkin.html`. The PIN constant is `DASH_PIN`.

### GitHub Repositories

Account: **recamoresca**
- `recamoresca/checkin` — source for `app-checkin.html`
- `recamoresca/firma` — source for `app-firma-ipad.html`
- `recamoresca/info` — source for `app-infoguests.html`

### Check-in Workflow (app-checkin.html)

4-step process: `s1` (guest info + document scan) → `s2` (signature on mobile) → `s3` (contact details) → `s4` (summary/confirm). Navigation controlled by `nx()` (next step) and `startCI()` (start check-in).
