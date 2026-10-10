"""FestGate backend — Every Event. One Smart Gate."""
import csv
import hmac
import io
import json
import os
import random
import string
import tempfile
import threading
import time
from copy import deepcopy
from datetime import datetime
from functools import wraps

from flask import Flask, Response, jsonify, request, send_from_directory, session

from seed_data import DEFAULT_DATABASE

# ==================== CONFIG ====================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DIST_DIR = os.path.join(BASE_DIR, "dist")
DATA_FILE = os.path.join(BASE_DIR, "festgate_db.json")

# Set these as environment variables in production!
SECRET_KEY = os.environ.get("SECRET_KEY", "dev-only-change-me")
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "festgate2026")
ADMIN_API_TOKEN = os.environ.get("ADMIN_API_TOKEN", "festgate2026")

FIREBASE_DATABASE_URL = os.environ.get("FIREBASE_DATABASE_URL", "")
FIREBASE_CREDENTIALS = os.environ.get("FIREBASE_CREDENTIALS", "")

AVATAR_COLORS = ["bg-purple-600", "bg-blue-600", "bg-emerald-600", "bg-rose-600", "bg-amber-600"]

app = Flask(__name__, static_folder="dist", static_url_path="")
app.secret_key = SECRET_KEY

db_lock = threading.RLock()  # prevents two gates from corrupting the JSON file


# ==================== FIREBASE (OPTIONAL) ====================

def init_firebase():
    """Return firebase `db` module if configured, else None."""
    if not (FIREBASE_DATABASE_URL and FIREBASE_CREDENTIALS and os.path.exists(FIREBASE_CREDENTIALS)):
        return None
    try:
        import firebase_admin
        from firebase_admin import credentials, db

        if not firebase_admin._apps:
            firebase_admin.initialize_app(
                credentials.Certificate(FIREBASE_CREDENTIALS),
                {"databaseURL": FIREBASE_DATABASE_URL},
            )
        print("[FestGate] Connected to Firebase Realtime Database.")
        return db
    except Exception as exc:
        print(f"[FestGate] Firebase skipped ({exc}). Using local JSON database.")
        return None


firebase_db = init_firebase()


def firebase_write(path, data, merge=False):
    """Best-effort sync to Firebase. Never breaks the request if it fails."""
    if not firebase_db:
        return
    try:
        ref = firebase_db.reference(path)
        ref.update(data) if merge else ref.set(data)
    except Exception as exc:
        print(f"[FestGate] Firebase sync error: {exc}")


# ==================== LOCAL JSON DATABASE ====================

def load_db():
    if not os.path.exists(DATA_FILE):
        data = deepcopy(DEFAULT_DATABASE)
        save_db(data)
        return data
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (OSError, json.JSONDecodeError):
        return deepcopy(DEFAULT_DATABASE)


def save_db(data):
    """Atomic write: a crash mid-write can't corrupt the database."""
    fd, tmp_path = tempfile.mkstemp(dir=BASE_DIR, suffix=".tmp")
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    os.replace(tmp_path, DATA_FILE)


# ==================== HELPERS ====================

def error_response(message, status, **extra):
    return jsonify({"error": message, **extra}), status


def find_event(db_data, event_id):
    return next((e for e in db_data.get("events", []) if e["id"] == event_id), None)


def make_initials(name):
    parts = name.split()
    return (parts[0][0] + (parts[-1][0] if len(parts) > 1 else "")).upper()


def generate_ticket_code(existing_codes):
    """Unique ticket code in the format FG-1234-AB."""
    while True:
        code = f"FG-{random.randint(1000, 9999)}-{''.join(random.choices(string.ascii_uppercase, k=2))}"
        if code not in existing_codes:
            return code


def admin_required(view):
    @wraps(view)
    def wrapper(*args, **kwargs):
        if not session.get("is_admin"):
            token = request.headers.get("Authorization", "")
            if not hmac.compare_digest(token, f"Bearer {ADMIN_API_TOKEN}"):
                return error_response("Unauthorized. Admin privileges required.", 401)
        return view(*args, **kwargs)

    return wrapper


# ==================== AUTH ROUTES ====================

@app.route("/api/status")
def api_status():
    return jsonify({
        "status": "online",
        "system": "FestGate Live Gateway v2.4",
        "cloud_sync": "Firebase Realtime DB" if firebase_db else "Persistent Local DB",
        "tagline": "Every Event. One Smart Gate.",
    })


@app.route("/api/auth/login", methods=["POST"])
def api_login():
    data = request.get_json(silent=True) or {}
    username = data.get("username", "").strip().lower()
    password = data.get("password", "").strip()

    if username == ADMIN_USERNAME and hmac.compare_digest(password, ADMIN_PASSWORD):
        session["is_admin"] = True
        return jsonify({"success": True, "message": "Admin authenticated successfully", "role": "superadmin"})
    return jsonify({"success": False, "error": "Invalid username or password"}), 401


@app.route("/api/auth/logout", methods=["POST"])
def api_logout():
    session.pop("is_admin", None)
    return jsonify({"success": True, "message": "Logged out successfully"})


@app.route("/api/auth/me")
def api_auth_me():
    return jsonify({"is_admin": bool(session.get("is_admin"))})


# ==================== EVENTS ====================

@app.route("/api/events", methods=["GET"])
def get_events():
    return jsonify(load_db().get("events", []))


@app.route("/api/events", methods=["POST"])
@admin_required
def create_event():
    payload = request.get_json(silent=True) or {}
    title = payload.get("title")
    if not title:
        return error_response("Event title is required", 400)

    new_event = {
        "id": f"evt-{int(time.time() * 1000)}",
        "title": title,
        "category": payload.get("category", "TECH"),
        "categoryColor": payload.get("categoryColor", "#0284C7"),
        "date": payload.get("date", "Oct 20, 2026"),
        "time": payload.get("time", "10:00 AM - 04:00 PM"),
        "venue": payload.get("venue", "Auditorium Hall 1"),
        "capacity": int(payload.get("capacity", 200)),
        "registeredCount": 0,
        "checkedInCount": 0,
        "description": payload.get("description", ""),
        "coordinator": payload.get("coordinator", {
            "name": "Prof. Alex Turner",
            "role": "Gate Lead",
            "initials": "AT",
            "avatarBg": "bg-indigo-600",
        }),
        "imageGradient": payload.get("imageGradient", "from-purple-900 via-indigo-900 to-black"),
    }

    with db_lock:
        db_data = load_db()
        db_data["events"].insert(0, new_event)
        save_db(db_data)

    firebase_write(f"events/{new_event['id']}", new_event)
    return jsonify(new_event), 201


# ==================== ATTENDEES ====================

@app.route("/api/attendees", methods=["GET"])
def get_attendees():
    return jsonify(load_db().get("attendees", []))


@app.route("/api/register", methods=["POST"])
def register_student():
    payload = request.get_json(silent=True) or {}
    name = payload.get("name", "").strip()
    roll_no = payload.get("rollNo", "").strip()
    email = payload.get("email", "").strip()
    event_id = payload.get("eventId", "")
    department = payload.get("department", "Engineering")

    if not (name and roll_no and email and event_id):
        return error_response("Missing required fields (name, rollNo, email, eventId)", 400)

    with db_lock:
        db_data = load_db()
        event = find_event(db_data, event_id)
        if not event:
            return error_response("Target event not found", 404)

        duplicate = next(
            (a for a in db_data["attendees"]
             if a["eventId"] == event_id
             and (a["rollNo"].lower() == roll_no.lower() or a["email"].lower() == email.lower())),
            None,
        )
        if duplicate:
            return error_response(
                "Duplicate registration: Student already registered for this event.",
                409,
                existingTicket=duplicate,
            )

        existing_codes = {a["ticketCode"] for a in db_data["attendees"]}
        ticket_code = generate_ticket_code(existing_codes)

        new_attendee = {
            "id": f"att-{int(time.time() * 1000)}",
            "ticketCode": ticket_code,
            "name": name,
            "rollNo": roll_no,
            "email": email,
            "department": department,
            "eventId": event["id"],
            "eventTitle": event["title"],
            "eventCategory": event["category"],
            "registeredAt": datetime.now().strftime("%Y-%m-%d %I:%M %p"),
            "status": "REGISTERED",
            "initials": make_initials(name),
            "avatarBg": random.choice(AVATAR_COLORS),
        }

        db_data["attendees"].insert(0, new_attendee)
        event["registeredCount"] = event.get("registeredCount", 0) + 1
        save_db(db_data)

    firebase_write(f"attendees/{ticket_code}", new_attendee)
    firebase_write(f"events/{event['id']}/registeredCount", event["registeredCount"])
    return jsonify(new_attendee), 201


# ==================== GATE VERIFICATION ====================

@app.route("/api/verify", methods=["POST"])
def verify_gate_pass():
    """
    1. Ticket not found        -> 404 INVALID
    2. Already CHECKED_IN      -> 409 DUPLICATE (re-entry denied)
    3. REGISTERED              -> 200 SUCCESS (admit, log time + gate staff)
    """
    payload = request.get_json(silent=True) or {}
    ticket_code = payload.get("ticketCode", "").strip().upper()
    gate_staff = payload.get("gateStaff", "Gate 1 - Lead")

    if not ticket_code:
        return jsonify({"success": False, "reason": "INVALID",
                        "message": "Please provide a valid ticket code."}), 400

    with db_lock:
        db_data = load_db()
        attendee = next(
            (a for a in db_data.get("attendees", []) if a["ticketCode"].upper() == ticket_code),
            None,
        )

        if not attendee:
            return jsonify({
                "success": False,
                "reason": "INVALID",
                "message": f"Ticket '{ticket_code}' was not found in the FestGate database.",
            }), 404

        if attendee.get("status") == "CHECKED_IN":
            return jsonify({
                "success": False,
                "reason": "DUPLICATE",
                "message": (f"DUPLICATE ATTENDANCE DETECTED! Pass was already scanned at "
                            f"{attendee.get('checkedInAt')} by {attendee.get('checkedInBy', 'Gate Staff')}. "
                            f"Re-entry denied."),
                "attendee": attendee,
            }), 409

        now_str = datetime.now().strftime("%Y-%m-%d %I:%M:%S %p")
        attendee.update(status="CHECKED_IN", checkedInAt=now_str, checkedInBy=gate_staff)

        event = find_event(db_data, attendee["eventId"])
        if event:
            event["checkedInCount"] = event.get("checkedInCount", 0) + 1

        db_data.setdefault("gate_logs", []).insert(0, {
            "ticketCode": ticket_code,
            "student": attendee["name"],
            "event": attendee["eventTitle"],
            "timestamp": now_str,
            "gateStaff": gate_staff,
            "result": "SUCCESS",
        })
        save_db(db_data)

    firebase_write(f"attendees/{ticket_code}",
                   {"status": "CHECKED_IN", "checkedInAt": now_str, "checkedInBy": gate_staff},
                   merge=True)
    if event:
        firebase_write(f"events/{event['id']}/checkedInCount", event["checkedInCount"])

    return jsonify({
        "success": True,
        "reason": "SUCCESS",
        "message": f"Access Granted! Welcome {attendee['name']} to {attendee['eventTitle']}.",
        "attendee": attendee,
    }), 200


# ==================== STATS & EXPORT ====================

@app.route("/api/stats")
def get_stats():
    db_data = load_db()
    attendees = db_data.get("attendees", [])
    total = len(attendees)
    checked_in = sum(1 for a in attendees if a.get("status") == "CHECKED_IN")

    return jsonify({
        "totalRegistered": total,
        "totalCheckedIn": checked_in,
        "verificationRate": round(checked_in / total * 100) if total else 0,
        "activeEventsCount": len(db_data.get("events", [])),
    })


@app.route("/api/export-csv")
def export_csv():
    attendees = load_db().get("attendees", [])

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Ticket ID", "Student Name", "Roll Number", "Email", "Department",
        "Event Title", "Registration Date", "Gate Status",
        "Check-In Timestamp", "Gate Staff",
    ])
    for a in attendees:
        writer.writerow([
            a.get("ticketCode", ""), a.get("name", ""), a.get("rollNo", ""),
            a.get("email", ""), a.get("department", ""), a.get("eventTitle", ""),
            a.get("registeredAt", ""), a.get("status", ""),
            a.get("checkedInAt", "N/A"), a.get("checkedInBy", "N/A"),
        ])

    filename = f"FestGate_Attendance_Report_{datetime.now():%Y-%m-%d}.csv"
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment;filename={filename}"},
    )


# ==================== FRONTEND (React build) ====================

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    if path and os.path.isfile(os.path.join(DIST_DIR, path)):
        return send_from_directory(DIST_DIR, path)
    if os.path.isfile(os.path.join(DIST_DIR, "index.html")):
        return send_from_directory(DIST_DIR, "index.html")
    return "FestGate backend is running. Build frontend with 'npm run build'."


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "1") == "1"
    print(f"\nFestGate — Every Event. One Smart Gate.\nListening on http://localhost:{port}\n")
    app.run(host="0.0.0.0", port=port, debug=debug)
