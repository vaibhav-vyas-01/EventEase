"""FestGate backend — auth, profiles and dashboards (Firebase Firestore storage)."""
import json
import os
import secrets
from collections import Counter
from datetime import datetime, timezone
from functools import wraps

import firebase_admin
import segno
from firebase_admin import auth as firebase_auth
from firebase_admin import credentials, firestore
from flask import Flask, jsonify, redirect, render_template, request, session, url_for
from google.cloud.firestore_v1.base_query import FieldFilter
from werkzeug.exceptions import HTTPException
from werkzeug.security import check_password_hash, generate_password_hash

# ==================== CONFIG ====================

# Set SECRET_KEY as an environment variable (Vercel -> Settings -> Environment Variables)!
SECRET_KEY = os.environ.get("SECRET_KEY", "dev-only-change-me")

# Either the full service-account JSON text (Vercel) or a path to the .json file (local).
FIREBASE_CREDENTIALS = os.environ.get("FIREBASE_CREDENTIALS", "")

MIN_PASSWORD_LENGTH = 8
PHONE_LENGTH = 10
FIRESTORE_IN_LIMIT = 30  # Firestore allows max 30 values in an "in" query

# Event form limits
EVENT_CATEGORIES = ("TECH", "DESIGN", "CULTURAL", "GAMING", "WORKSHOP")
MAX_TITLE_LENGTH = 100
MAX_VENUE_LENGTH = 120
MAX_DESCRIPTION_LENGTH = 1000
MAX_CAPACITY = 100000

# Gate passes
PASS_CODE_TRIES = 5  # random 6-digit codes tried before giving up (collisions are very rare)
MAX_GATE_LENGTH = 40

app = Flask(__name__, template_folder="templates", static_folder="static")
app.secret_key = SECRET_KEY

# Firestore collection names
EVENTS = "events"
REGISTRATIONS = "registrations"
EMAIL_INDEX = "emails"  # emails/{email} -> {role, user_id}; guarantees unique emails
COUNTERS = "counters"  # counters/{role} -> {value}; used for P001, P002, ... IDs
PASSES = "passes"  # passes/{6-digit code} -> {reg_id, event_id}; guarantees unique codes

# Everything that differs between the two roles lives here, so the
# rest of the code never needs `if role == 'participant' ... else ...`.
ROLES = {
    "participant": {
        "label": "a Participant",
        "collection": "participants",
        "id_key": "participant_id",
        "id_prefix": "P",
        "dashboard_endpoint": "student_dashboard",
        "profile_fields": ("college", "roll_number", "phone"),
        "fields": (
            "participant_id", "full_name", "email", "college", "roll_number",
            "phone", "password_hash", "auth_provider", "google_uid",
            "profile_complete", "created_at", "last_login",
        ),
        "public_fields": (
            "participant_id", "full_name", "email", "college", "roll_number",
            "phone", "auth_provider", "profile_complete",
        ),
    },
    "organizer": {
        "label": "an Organizer",
        "collection": "organizers",
        "id_key": "organizer_id",
        "id_prefix": "O",
        "dashboard_endpoint": "organizer_dashboard",
        "profile_fields": ("organization_name", "committee_name", "phone"),
        "fields": (
            "organizer_id", "full_name", "email", "organization_name", "committee_name",
            "designation", "phone", "password_hash", "auth_provider", "google_uid",
            "profile_complete", "created_at", "last_login",
        ),
        "public_fields": (
            "organizer_id", "full_name", "email", "organization_name", "committee_name",
            "designation", "phone", "auth_provider", "profile_complete",
        ),
    },
}

# ==================== FIRESTORE ====================

_db = None


def init_firebase():
    """Initialise the Firebase Admin SDK once (safe to call many times)."""
    if firebase_admin._apps:
        return
    raw = FIREBASE_CREDENTIALS.strip()
    if raw.startswith("{"):
        cred = credentials.Certificate(json.loads(raw))
    elif raw and os.path.exists(raw):
        cred = credentials.Certificate(raw)
    else:
        raise RuntimeError(
            "FIREBASE_CREDENTIALS is not set. Put the service-account JSON text "
            "(or a path to the .json file) in this environment variable."
        )
    firebase_admin.initialize_app(cred)


def get_db():
    global _db
    if _db is None:
        init_firebase()
        _db = firestore.client()
    return _db


def query_docs(collection, field, op, value):
    """Return all documents (as dicts) where `field <op> value`."""
    query = get_db().collection(collection).where(filter=FieldFilter(field, op, value))
    return [doc.to_dict() for doc in query.stream()]


# ==================== USER HELPERS ====================

def now_iso():
    return datetime.now(timezone.utc).isoformat()


def clean(data, key):
    """Get a stripped string from a JSON payload (None-safe)."""
    return str(data.get(key) or "").strip()


def to_int(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return 0


def pick(source, keys):
    return {key: source.get(key) for key in keys}


def user_id_of(user, role):
    return user[ROLES[role]["id_key"]]


def find_user_by_id(user_id, role):
    if role not in ROLES:
        return None
    snap = get_db().collection(ROLES[role]["collection"]).document(user_id).get()
    return snap.to_dict() if snap.exists else None


def find_user_by_email(email):
    """Return (user, role) for this email across both roles, else (None, None)."""
    index = get_db().collection(EMAIL_INDEX).document(email.strip().lower()).get()
    if not index.exists:
        return None, None
    entry = index.to_dict()
    user = find_user_by_id(entry["user_id"], entry["role"])
    return (user, entry["role"]) if user else (None, None)


@firestore.transactional
def _create_user_in_txn(txn, db, role, email, fields):
    """All-or-nothing: claim the email, take the next ID, save the user."""
    cfg = ROLES[role]
    email_ref = db.collection(EMAIL_INDEX).document(email)
    counter_ref = db.collection(COUNTERS).document(role)

    # Firestore transactions: all reads first, then writes.
    email_snap = email_ref.get(transaction=txn)
    if email_snap.exists:
        return None, email_snap.to_dict()["role"]
    counter_snap = counter_ref.get(transaction=txn)

    current = counter_snap.to_dict().get("value", 0) if counter_snap.exists else 0
    number = current + 1
    user_id = f"{cfg['id_prefix']}{number:03d}"

    user = dict.fromkeys(cfg["fields"], "")
    user.update(profile_complete="false", created_at=now_iso(), last_login=now_iso())
    user.update(fields)
    user.update(email=email, **{cfg["id_key"]: user_id})

    txn.set(counter_ref, {"value": number})
    txn.set(db.collection(cfg["collection"]).document(user_id), user)
    txn.set(email_ref, {"role": role, "user_id": user_id})
    return user, None


def create_user(role, email, **fields):
    """Returns (user, None) on success, or (None, existing_role) if the email is taken."""
    db = get_db()
    return _create_user_in_txn(db.transaction(), db, role, email, fields)


def update_user(role, user_id, changes):
    get_db().collection(ROLES[role]["collection"]).document(user_id).update(changes)


def is_profile_complete(user, role):
    if not user:
        return False
    if str(user.get("profile_complete", "")).lower() == "true":
        return True
    return all(user.get(field) for field in ROLES[role]["profile_fields"])


# ==================== RESPONSE / SESSION HELPERS ====================

def api_error(message, status=400, field=None):
    body = {"success": False, "message": message}
    if field:
        body["field"] = field
    return jsonify(body), status


def api_success(message, redirect_url):
    return jsonify({"success": True, "message": message, "redirect_url": redirect_url})


def email_taken_error(existing_role, role):
    if existing_role != role:
        return api_error(
            f"This email is registered as {ROLES[existing_role]['label']}. Please use the correct tab."
        )
    return api_error("An account with this email already exists. Please log in.")


def dashboard_url(role):
    return url_for(ROLES[role]["dashboard_endpoint"])


def landing_url(user, role):
    """Where a logged-in user should go next."""
    return dashboard_url(role) if is_profile_complete(user, role) else url_for("complete_profile")


def start_session(user, role):
    session["user_id"] = user_id_of(user, role)
    session["role"] = role


def login_required(view):
    """For pages: send logged-out users back to the home page."""
    @wraps(view)
    def wrapper(*args, **kwargs):
        if not session.get("user_id") or not session.get("role"):
            return redirect(url_for("index"))
        return view(*args, **kwargs)

    return wrapper


def api_login_required(view):
    """For API routes: answer logged-out users with JSON 401 (never an HTML redirect)."""
    @wraps(view)
    def wrapper(*args, **kwargs):
        if not session.get("user_id") or not session.get("role"):
            return api_error("Please log in to continue.", 401)
        return view(*args, **kwargs)

    return wrapper


@app.errorhandler(Exception)
def handle_error(exc):
    """API routes always answer with JSON, so the frontend never sees an HTML error page."""
    is_http = isinstance(exc, HTTPException)
    if not is_http:
        app.logger.exception("Unhandled error on %s", request.path)

    if request.path.startswith("/api/"):
        status = exc.code if is_http else 500
        message = exc.description if is_http else "Server error. Please try again."
        return api_error(message, status)
    return exc if is_http else ("Internal Server Error", 500)


# ==================== PAGES ====================

@app.route("/")
def index():
    user_id, role = session.get("user_id"), session.get("role")
    if user_id and role:
        user = find_user_by_id(user_id, role)
        if user:
            return redirect(landing_url(user, role))
    return render_template("index.html")


@app.route("/complete-profile")
@login_required
def complete_profile():
    role = session["role"]
    user = find_user_by_id(session["user_id"], role)
    if not user:
        session.clear()
        return redirect(url_for("index"))
    if is_profile_complete(user, role):
        return redirect(dashboard_url(role))
    return render_template("complete_profile.html", user=user, role=role)


def render_dashboard(role, template):
    """Shared logic for both dashboards: right role, profile complete, then render."""
    current_role = session["role"]
    if current_role != role:
        return redirect(dashboard_url(current_role))
    user = find_user_by_id(session["user_id"], role)
    if not user or not is_profile_complete(user, role):
        return redirect(url_for("complete_profile"))
    return render_template(template, user=user)


@app.route("/student/dashboard")
@login_required
def student_dashboard():
    return render_dashboard("participant", "participant_dashboard.html")


@app.route("/organizer/dashboard")
@login_required
def organizer_dashboard():
    return render_dashboard("organizer", "organizer_dashboard.html")


# ==================== AUTH APIS ====================

@app.route("/api/auth/signup", methods=["POST"])
def api_signup():
    data = request.get_json(silent=True) or {}
    role = clean(data, "role").lower() or "participant"
    full_name = clean(data, "full_name")
    email = clean(data, "email").lower()
    password = data.get("password") or ""
    confirm_password = data.get("confirm_password") or ""

    if role not in ROLES:
        return api_error("Invalid role specified.")
    if not full_name:
        return api_error("Please enter your full name.", field="full_name")
    if "@" not in email or "/" in email:
        return api_error("Please enter a valid email address.", field="email")
    if len(password) < MIN_PASSWORD_LENGTH:
        return api_error(f"Password must be at least {MIN_PASSWORD_LENGTH} characters long.", field="password")
    if password != confirm_password:
        return api_error("Passwords do not match.", field="confirm_password")

    user, existing_role = create_user(
        role,
        email,
        full_name=full_name,
        password_hash=generate_password_hash(password),
        auth_provider="password",
    )
    if existing_role:
        return email_taken_error(existing_role, role)

    start_session(user, role)
    return api_success("Account created successfully!", url_for("complete_profile"))


@app.route("/api/auth/login", methods=["POST"])
def api_login():
    data = request.get_json(silent=True) or {}
    role = clean(data, "role").lower() or "participant"
    email = clean(data, "email").lower()
    password = data.get("password") or ""

    if not email or not password:
        return api_error("Email and password are required.")

    user, user_role = find_user_by_email(email)
    if not user:
        return api_error("No account found with this email address.", 404)
    if user_role != role:
        return email_taken_error(user_role, role)

    stored_hash = user.get("password_hash", "")
    if not stored_hash or not check_password_hash(stored_hash, password):
        return api_error("Invalid password. Please check and try again.", 401, field="password")

    update_user(role, user_id_of(user, role), {"last_login": now_iso()})
    start_session(user, role)
    return api_success("Logged in successfully!", landing_url(user, role))


@app.route("/api/auth/google", methods=["POST"])
def api_google_auth():
    data = request.get_json(silent=True) or {}
    token = data.get("id_token")
    role = clean(data, "role").lower() or "participant"

    if not token:
        return api_error("Missing Firebase ID token.")
    if role not in ROLES:
        return api_error("Invalid role.")

    try:
        init_firebase()
        # clock_skew_seconds avoids random "Token used too early" errors
        claims = firebase_auth.verify_id_token(token, clock_skew_seconds=10)
    except Exception as exc:
        app.logger.warning("Google token verification failed: %s", exc)
        return api_error("Google token verification failed. Please try again.", 401)

    email = (claims.get("email") or "").strip().lower()
    name = claims.get("name", "Google User")
    google_uid = claims.get("uid") or claims.get("sub", "")

    if not email:
        return api_error("Google account does not contain a verified email.")

    user, existing_role = find_user_by_email(email)

    if user:
        if existing_role != role:
            return email_taken_error(existing_role, role)
        changes = {"last_login": now_iso()}
        if not user.get("google_uid"):
            changes["google_uid"] = google_uid
        update_user(role, user_id_of(user, role), changes)
    else:
        user, taken_by = create_user(
            role, email, full_name=name, auth_provider="google", google_uid=google_uid
        )
        if taken_by:  # someone created this email a moment ago
            return email_taken_error(taken_by, role)

    start_session(user, role)
    return api_success(f"Signed in as {email}!", landing_url(user, role))


@app.route("/api/logout", methods=["POST"])
def api_logout():
    session.clear()
    return jsonify({"success": True, "redirect_url": "/"})


# ==================== PROFILE COMPLETION ====================

def complete_participant_profile(user_id, data, phone):
    college = clean(data, "college")
    roll_number = clean(data, "roll_number").upper()

    if not college:
        return api_error("College Name is required.", field="college")
    if not roll_number:
        return api_error("Roll Number is required.", field="roll_number")

    owners = query_docs(ROLES["participant"]["collection"], "roll_number", "==", roll_number)
    if any(owner.get("participant_id") != user_id for owner in owners):
        return api_error(
            "This Roll Number is already registered by another participant.", field="roll_number"
        )

    update_user("participant", user_id, {
        "college": college, "roll_number": roll_number,
        "phone": phone, "profile_complete": "true",
    })
    return api_success("Profile completed successfully!", url_for("student_dashboard"))


def complete_organizer_profile(user_id, data, phone):
    organization_name = clean(data, "organization_name")
    committee_name = clean(data, "committee_name")

    if not organization_name:
        return api_error("College / Organization Name is required.", field="organization_name")
    if not committee_name:
        return api_error("Committee or Department Name is required.", field="committee_name")

    update_user("organizer", user_id, {
        "organization_name": organization_name, "committee_name": committee_name,
        "designation": clean(data, "designation"), "phone": phone, "profile_complete": "true",
    })
    return api_success("Profile completed successfully!", url_for("organizer_dashboard"))


PROFILE_HANDLERS = {
    "participant": complete_participant_profile,
    "organizer": complete_organizer_profile,
}


@app.route("/api/profile/complete", methods=["POST"])
@login_required
def api_complete_profile():
    handler = PROFILE_HANDLERS.get(session["role"])
    if not handler:
        return api_error("Invalid role.")

    data = request.get_json(silent=True) or {}
    phone = clean(data, "phone")
    if not (phone.isdigit() and len(phone) == PHONE_LENGTH):
        return api_error(f"Phone number must be exactly {PHONE_LENGTH} digits.", field="phone")

    return handler(session["user_id"], data, phone)


# ==================== GATE PASSES (registration + one-time check-in) ====================

def new_pass_code():
    """Random 6-digit code (100000-999999). Unguessable order, no leading zeros."""
    return str(100000 + secrets.randbelow(900000))


def make_qr_svg(code):
    """Inline SVG of a standard QR (micro=False: phones and scanners can't read Micro QR)."""
    return segno.make(code, error="m", micro=False).svg_inline(
        scale=8, border=4, dark="#000000", light="#ffffff", omitsize=True  # omitsize -> viewBox, so CSS can resize it
    )


def build_pass(reg, event):
    """What the participant sees: the registration + its event details + the QR."""
    event = event or {}
    return {
        **pick(reg, ("reg_id", "event_id", "ticket_code", "checked_in", "checked_in_at",
                     "registered_at", "name", "roll_number")),
        "event_title": event.get("title", "Event"),
        "event_date": event.get("date", ""),
        "event_start_time": event.get("start_time", ""),
        "event_end_time": event.get("end_time", ""),
        "event_venue": event.get("venue", ""),
        "event_category": event.get("category", ""),
        "qr_svg": make_qr_svg(reg["ticket_code"]),
    }


@firestore.transactional
def _register_in_txn(txn, db, event_id, user, codes):
    """All-or-nothing: check seats, claim a unique code, save the registration, count it."""
    participant_id = user["participant_id"]
    event_ref = db.collection(EVENTS).document(event_id)
    reg_id = f"{event_id}_{participant_id}"  # one registration per participant per event
    reg_ref = db.collection(REGISTRATIONS).document(reg_id)

    # Firestore transactions: all reads first, then writes.
    event_snap = event_ref.get(transaction=txn)
    reg_snap = reg_ref.get(transaction=txn)
    if not event_snap.exists:
        return "not_found", None, None
    event = event_snap.to_dict()
    if reg_snap.exists:
        return "exists", reg_snap.to_dict(), event

    registered = event.get("registered_count", 0)
    if registered >= to_int(event.get("capacity")):
        return "full", None, event

    code, pass_ref = None, None
    for candidate in codes:
        candidate_ref = db.collection(PASSES).document(candidate)
        if not candidate_ref.get(transaction=txn).exists:
            code, pass_ref = candidate, candidate_ref
            break
    if not code:
        return "no_code", None, event

    reg = {
        "reg_id": reg_id,
        "event_id": event_id,
        "participant_id": participant_id,
        "name": user.get("full_name", ""),
        "email": user.get("email", ""),
        "roll_number": user.get("roll_number", ""),
        "ticket_code": code,
        "checked_in": "0",
        "registered_at": now_iso(),
    }
    txn.set(reg_ref, reg)
    txn.set(pass_ref, {"reg_id": reg_id, "event_id": event_id})
    txn.update(event_ref, {"registered_count": registered + 1})
    return "created", reg, event


@firestore.transactional
def _check_in_in_txn(txn, db, code, organizer_id, gate, stamp):
    """Admit a pass exactly once. Two scans at the same moment: one wins, the other sees DUPLICATE."""
    pass_snap = db.collection(PASSES).document(code).get(transaction=txn)
    if not pass_snap.exists:
        return "invalid", None, None
    pass_data = pass_snap.to_dict()

    reg_ref = db.collection(REGISTRATIONS).document(pass_data["reg_id"])
    event_ref = db.collection(EVENTS).document(pass_data["event_id"])
    reg_snap = reg_ref.get(transaction=txn)
    event_snap = event_ref.get(transaction=txn)
    if not (reg_snap.exists and event_snap.exists):
        return "invalid", None, None

    reg, event = reg_snap.to_dict(), event_snap.to_dict()
    if event.get("organizer_id") != organizer_id:  # organizers can only admit their own events
        return "invalid", None, None
    if is_checked_in(reg):
        return "duplicate", reg, event

    changes = {"checked_in": "1", "checked_in_at": stamp, "checked_in_by": gate}
    txn.update(reg_ref, changes)
    txn.update(event_ref, {"checked_in_count": event.get("checked_in_count", 0) + 1})
    reg.update(changes)
    return "success", reg, event


@app.route("/api/participant/register", methods=["POST"])
@api_login_required
def api_register_for_event():
    if session["role"] != "participant":
        return api_error("Only participants can register for events.", 403)

    event_id = clean(request.get_json(silent=True) or {}, "event_id")
    if not event_id:
        return api_error("Please choose an event.", field="event_id")
    if "/" in event_id:
        return api_error("Event not found.", 404)

    user = find_user_by_id(session["user_id"], "participant")
    if not user:
        return api_error("Account not found. Please log in again.", 404)
    if not is_profile_complete(user, "participant"):
        return api_error("Please complete your profile before registering.", 403)

    db = get_db()
    codes = [new_pass_code() for _ in range(PASS_CODE_TRIES)]
    status, reg, event = _register_in_txn(db.transaction(), db, event_id, user, codes)

    if status == "not_found":
        return api_error("Event not found.", 404)
    if status == "full":
        return api_error("Sorry, this event is full.", 409)
    if status == "no_code":
        return api_error("Could not generate your pass. Please try again.", 503)
    if status == "exists":
        return jsonify({
            "success": False,
            "message": "You are already registered for this event.",
            "pass": build_pass(reg, event),
        }), 409

    return jsonify({
        "success": True,
        "message": "You're registered! Your gate pass is ready.",
        "pass": build_pass(reg, event),
    }), 201


@app.route("/api/organizer/checkin", methods=["POST"])
@api_login_required
def api_check_in():
    """Gate check-in. SUCCESS (200) / DUPLICATE (409) / INVALID (404 or 400)."""
    if session["role"] != "organizer":
        return api_error("Only organizers can check people in.", 403)

    data = request.get_json(silent=True) or {}
    code = "".join(ch for ch in clean(data, "code") if ch.isdigit())  # accepts "482 915"
    gate = clean(data, "gate")[:MAX_GATE_LENGTH] or "Gate 1"

    if len(code) != 6:
        return jsonify({"success": False, "reason": "INVALID",
                        "message": "Please enter the 6-digit pass code."}), 400

    db = get_db()
    status, reg, event = _check_in_in_txn(
        db.transaction(), db, code, session["user_id"], gate, now_iso()
    )

    if status == "invalid":
        # Same answer for "no such code" and "someone else's event", so codes can't be probed.
        return jsonify({"success": False, "reason": "INVALID",
                        "message": "This pass code was not found for your events."}), 404

    attendee = {
        "name": reg.get("name", ""),
        "roll_number": reg.get("roll_number", ""),
        "email": reg.get("email", ""),
        "event_title": event.get("title", ""),
        "checked_in_at": reg.get("checked_in_at", ""),
        "checked_in_by": reg.get("checked_in_by", ""),
    }
    if status == "duplicate":
        return jsonify({
            "success": False,
            "reason": "DUPLICATE",
            "message": "Already checked in. Re-entry denied.",
            "attendee": attendee,
        }), 409

    return jsonify({
        "success": True,
        "reason": "SUCCESS",
        "message": f"Access granted! Welcome {attendee['name']}.",
        "attendee": attendee,
    })


# ==================== DASHBOARD APIS ====================

def is_checked_in(registration):
    return str(registration.get("checked_in", "0")) in ("1", "True", "true")


@app.route("/api/participant/me")
@api_login_required
def api_participant_me():
    if session["role"] != "participant":
        return jsonify({"error": "Unauthorized"}), 403

    user_id = session["user_id"]
    user = find_user_by_id(user_id, "participant")
    if not user:
        return jsonify({"error": "User not found"}), 404

    my_regs = query_docs(REGISTRATIONS, "participant_id", "==", user_id)
    all_events = [doc.to_dict() for doc in get_db().collection(EVENTS).stream()]
    events_by_id = {e.get("event_id"): e for e in all_events}
    my_reg_by_event = {r.get("event_id"): r for r in my_regs}

    # What the event cards need: seats taken + "have I already registered?"
    for event in all_events:
        event.pop("organizer_id", None)
        event["registered_count"] = event.get("registered_count", 0)
        my_reg = my_reg_by_event.get(event.get("event_id"))
        event["my_reg_id"] = my_reg["reg_id"] if my_reg else None
    all_events.sort(key=lambda e: (e.get("date", ""), e.get("start_time", "")))

    passes = [build_pass(r, events_by_id.get(r.get("event_id"))) for r in my_regs]
    passes.sort(key=lambda p: (p["event_date"], p["event_start_time"]))

    return jsonify({
        **pick(user, ROLES["participant"]["public_fields"]),
        "stats": {
            "events_registered": len(my_regs),
            "passes": len(my_regs),
            "checked_in": sum(is_checked_in(r) for r in my_regs),
        },
        "events": all_events,
        "passes_list": passes,
    })


@app.route("/api/organizer/me")
@api_login_required
def api_organizer_me():
    if session["role"] != "organizer":
        return jsonify({"error": "Unauthorized"}), 403

    user_id = session["user_id"]
    user = find_user_by_id(user_id, "organizer")
    if not user:
        return jsonify({"error": "User not found"}), 404

    my_events = query_docs(EVENTS, "organizer_id", "==", user_id)
    event_ids = [e["event_id"] for e in my_events if e.get("event_id")]

    my_regs = []
    for start in range(0, len(event_ids), FIRESTORE_IN_LIMIT):
        chunk = event_ids[start:start + FIRESTORE_IN_LIMIT]
        my_regs += query_docs(REGISTRATIONS, "event_id", "in", chunk)

    # Counts are always calculated from the registrations themselves,
    # so they can never get out of sync with the real data.
    registered_per_event = Counter(r.get("event_id") for r in my_regs)
    checked_in_per_event = Counter(r.get("event_id") for r in my_regs if is_checked_in(r))
    for event in my_events:
        event["registered_count"] = registered_per_event[event.get("event_id")]
        event["checked_in_count"] = checked_in_per_event[event.get("event_id")]
    my_events.sort(key=lambda e: (e.get("date", ""), e.get("start_time", "")))

    total_capacity = sum(to_int(e.get("capacity")) for e in my_events)
    capacity_used = f"{len(my_regs) / total_capacity * 100:.1f}%" if total_capacity else "0%"

    return jsonify({
        **pick(user, ROLES["organizer"]["public_fields"]),
        "stats": {
            "total_registrations": len(my_regs),
            "checked_in": sum(is_checked_in(r) for r in my_regs),
            "capacity_used": capacity_used,
        },
        "events": my_events,
    })


# ==================== ORGANIZER EVENTS ====================

def parse_time(value):
    """'HH:MM' -> datetime.time, or None if invalid."""
    try:
        return datetime.strptime(value, "%H:%M").time()
    except ValueError:
        return None


def parse_event_payload(data):
    """Validate the create-event form. Returns (fields, None) or (None, error_response)."""
    title = clean(data, "title")
    category = clean(data, "category").upper() or "TECH"
    date_text = clean(data, "date")
    start_text = clean(data, "start_time")
    end_text = clean(data, "end_time")
    venue = clean(data, "venue")
    description = clean(data, "description")
    capacity = to_int(data.get("capacity"))

    if not title:
        return None, api_error("Event title is required.", field="title")
    if len(title) > MAX_TITLE_LENGTH:
        return None, api_error(f"Title can be at most {MAX_TITLE_LENGTH} characters.", field="title")
    if category not in EVENT_CATEGORIES:
        return None, api_error("Please choose a valid category.", field="category")

    try:
        event_date = datetime.strptime(date_text, "%Y-%m-%d").date()
    except ValueError:
        return None, api_error("Please choose a valid date.", field="date")

    start_time, end_time = parse_time(start_text), parse_time(end_text)
    if not start_time:
        return None, api_error("Please choose a valid start time.", field="start_time")
    if not end_time:
        return None, api_error("Please choose a valid end time.", field="end_time")
    if end_time <= start_time:
        return None, api_error("End time must be after the start time.", field="end_time")

    if not venue:
        return None, api_error("Venue is required.", field="venue")
    if len(venue) > MAX_VENUE_LENGTH:
        return None, api_error(f"Venue can be at most {MAX_VENUE_LENGTH} characters.", field="venue")
    if not 1 <= capacity <= MAX_CAPACITY:
        return None, api_error(f"Capacity must be between 1 and {MAX_CAPACITY}.", field="capacity")
    if len(description) > MAX_DESCRIPTION_LENGTH:
        return None, api_error(f"Description can be at most {MAX_DESCRIPTION_LENGTH} characters.", field="description")

    return {
        "title": title,
        "category": category,
        "date": event_date.isoformat(),
        "start_time": start_time.strftime("%H:%M"),
        "end_time": end_time.strftime("%H:%M"),
        "venue": venue,
        "description": description,
        "capacity": capacity,
    }, None


@app.route("/api/organizer/events", methods=["POST"])
@api_login_required
def api_create_event():
    if session["role"] != "organizer":
        return api_error("Only organizers can create events.", 403)

    fields, error = parse_event_payload(request.get_json(silent=True) or {})
    if error:
        return error

    doc_ref = get_db().collection(EVENTS).document()  # Firestore makes a unique ID
    event = {
        "event_id": doc_ref.id,
        "organizer_id": session["user_id"],
        **fields,
        "created_at": now_iso(),
    }
    doc_ref.set(event)

    return jsonify({"success": True, "message": "Event created successfully!", "event": event}), 201


@app.route("/api/organizer/events/<event_id>", methods=["DELETE"])
@api_login_required
def api_delete_event(event_id):
    if session["role"] != "organizer":
        return api_error("Only organizers can delete events.", 403)

    db = get_db()
    doc_ref = db.collection(EVENTS).document(event_id)
    snap = doc_ref.get()
    # Same message for "missing" and "someone else's" so IDs can't be probed.
    if not snap.exists or snap.to_dict().get("organizer_id") != session["user_id"]:
        return api_error("Event not found.", 404)

    registrations = db.collection(REGISTRATIONS).where(
        filter=FieldFilter("event_id", "==", event_id)
    ).limit(1).stream()
    if any(True for _ in registrations):
        return api_error("This event already has registrations, so it can't be deleted.", 409)

    doc_ref.delete()
    return jsonify({"success": True, "message": "Event deleted."})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "1") == "1"
    app.run(host="0.0.0.0", port=port, debug=debug)
