# 🎟️ EventEase

**College Event Registration, Ticketing & Gate Check-In Platform**
Built for **Code Carnival – Atmiya University** · Problem Statement **PS-03: EventEase**

EventEase lets a college fest run a capacity-limited event end to end: students register and get a unique QR ticket, volunteers verify tickets at the gate, and organizers see live attendance and export an audit-ready report.

---

## 1. Problem Statement (PS-03)

College events are usually managed with Google Forms, WhatsApp groups and paper lists. That leads to:

- No control over seat capacity
- No unique, verifiable entry proof per participant
- Duplicate or fake entries at the gate
- No live count of registrations vs. actual attendance
- Manual, error-prone attendance reports

**EventEase solves this** with capacity-limited registration, a unique ticket code and QR per participant, check-in verification with duplicate prevention, and live registration and attendance counts.

---

## 2. Research Behind the Product

Before building, we studied 10 existing platforms to understand how registration, ticketing and check-in are handled today:

| Category | Platforms studied |
|---|---|
| Ticketing / event listing | BookMyShow, Paytm Insider, Eventbrite, Townscript, Allevents.in |
| College / fest focused | BookMyFest, SignupDesk |
| Event management suites | Zoho Backstage |
| Form-based (what colleges use today) | Google Forms, Typeform |

Our MVP focuses on the core flow every one of these needs at a campus gate: **register → get unique ticket → verify once at entry → report.**

---

## 3. Features

### 🎓 Participant (students & visitors)
- Mobile-friendly registration form: Name, Email, Roll Number
- Seat-availability shown per event; registration closes automatically at max capacity
- Duplicate registration blocked (same email or roll number for the same event)
- Unique alphanumeric ticket code (e.g. `EE-7K2M9QXA`) with an on-screen **QR code**
- Downloadable **pass image (PNG)**; lost-pass lookup by ticket code

### 🧑‍💼 Organizer (student coordinators / fest committee)
- Separate signup and login (salted PBKDF2 password hashing, invite-code protected signup)
- Live dashboard (auto-refresh every 5 s): **Total Registrations · Total Checked-In · Live Turnout %**
- Event creation: Title, Description, Max Capacity, Entry Fee
- One-click **attendance CSV export** of verified check-ins (for official reporting and NAAC audits)

### 🚪 Gate volunteers
- PIN-protected gate screen with configurable gate name (Gate 1, Gate 2…)
- Verify by typing the ticket code or **scanning the QR with the webcam**
- **Atomic validation:**
  - 🟩 Valid and not yet used → marked checked-in with timestamp and gate → **full green screen**
  - 🟥 Already used → rejected, shows **previous check-in time and gate** → **full red screen**
  - 🟧 Unknown code → amber "Invalid ticket" screen

---

## 4. Tech Stack

| Layer | Choice |
|---|---|
| Language | Python 3.10+ |
| UI / state | Streamlit |
| Storage | Local CSV files (no database setup) |
| Data handling | pandas |
| QR + pass image | `qrcode`, Pillow |
| QR scanning (optional) | OpenCV (`opencv-python-headless`) |

---

## 5. Project Structure

```
eventease/
├── app.py              # complete application (UI + logic)
├── requirements.txt
├── README.md
└── data/               # auto-created on first run
    ├── organizers.csv
    ├── events.csv
    └── registrations.csv
```

### Data model

| File | Columns |
|---|---|
| `organizers.csv` | username, full_name, password_hash, salt, created_at |
| `events.csv` | event_id, organizer_username, title, description, max_capacity, entry_fee, created_at |
| `registrations.csv` | ticket_code, event_id, name, email, roll_no, registered_at, **is_checked_in**, checked_in_at, checked_in_gate |

---

## 6. Setup & Run

```bash
# 1. (optional) create a virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 2. install dependencies
pip install -r requirements.txt

# 3. run
streamlit run app.py
```

Open the URL shown in the terminal (usually `http://localhost:8501`). To test on a phone, use the Network URL on the same Wi-Fi.

> Webcam QR scanning requires HTTPS or `localhost`. For phones at a live gate, deploy (e.g. Streamlit Community Cloud) or use a tunnel such as ngrok.

### Configuration (environment variables)

| Variable | Default | Purpose |
|---|---|---|
| `EVENTEASE_GATE_PIN` | `gate123` | PIN volunteers use to unlock the gate screen |
| `EVENTEASE_ORGANIZER_INVITE` | `FEST2026` | Invite code needed to create an organizer account |

**Change both before a real event.**

---

## 7. Demo Flow (3 minutes)

1. **Organizer tab** → create account (invite code) → log in → create an event (e.g. capacity 2).
2. **Participant tab** → register a student → ticket code, QR and downloadable pass appear.
3. Register again with the same email → blocked. Register until capacity is reached → "event is full".
4. **Gate tab** → unlock with PIN → enter the ticket code → **FULL GREEN** screen.
5. Scan the **same ticket again** → **FULL RED** screen with the previous time and gate.
6. **Organizer tab** → watch the live metrics update → download the attendance CSV.

---

## 8. How Duplicate Entry Is Prevented

Check-in is a single locked read → check → write operation on `registrations.csv`. If two volunteers scan the same ticket at the same moment, only the first succeeds; the second sees the already-checked-in record and gets the red screen. Writes go to a temp file and are swapped in with `os.replace`, so a crash never leaves a half-written CSV.

---

## 9. Current Limitations (MVP)

- Entry fee is recorded and displayed, but **no online payment** is collected yet.
- CSV storage with an in-process lock is safe for a single server process; for multiple workers or a very large crowd, move to SQLite or PostgreSQL.
- No email delivery of tickets yet (pass is downloaded or looked up on screen).
- Gate access uses a shared PIN rather than individual volunteer accounts.

---

## 10. Team

Add your team name and members here.

---

*Built for Code Carnival, Atmiya University.*
