"""FestGate backend — auth, profiles and dashboards (CSV storage)."""
import csv
import os
import tempfile
import threading
from datetime import datetime, timezone
from functools import wraps

from flask import Flask, jsonify, redirect, render_template, request, session, url_for
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from werkzeug.security import check_password_hash, generate_password_hash

# ==================== CONFIG ====================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

# Set SECRET_KEY as an environment variable in production!
SECRET_KEY = os.environ.get("SECRET_KEY", "dev-only-change-me")
FIREBASE_PROJECT_ID = os.environ.get("FIREBASE_PROJECT_ID", "festgate-a1f30")

MIN_PASSWORD_LENGTH = 8
PHONE_LENGTH = 10

app = Flask(__name__, template_folder="templates", static_folder="static")
app.secret_key = SECRET_KEY

# ==================== CSV SCHEMAS ====================

PARTICIPANT_HEADERS = [
    "participant_id", "full_name", "email", "college", "roll_number",
    "phone", "password_hash", "auth_provider", "google_uid",
    "profile_complete", "created_at", "last_login",
]
ORGANIZER_HEADERS = [
    "organizer_id", "full_name", "email", "organization_name", "committee_name",
    "designation", "phone", "password_hash", "auth_provider", "google_uid",
    "profile_complete", "created_at", "last_login",
]
EVENT_HEADERS = ["event_id", "organizer_id", "title", "date", "venue", "description", "capacity"]
REGISTRATION_HEADERS = ["reg_id", "event_id", "name", "email", "ticket_code", "checked_in", "registered_at"]

EVENTS_CSV = os.path.join(DATA_DIR, "events.csv")
REGISTRATIONS_CSV = os.path.join(DATA_DIR, "registrations.csv")

# Everything that differs between the two roles lives here, so the
# rest of the code never needs `if role == 'participant' ... else ...`.
ROLES = {
    "participant": {
        "label": "a Participant",
        "csv": os.path.join(DATA_DIR, "participants.csv"),
        "headers": PARTICIPANT_HEADERS,
        "id_key": "participant_id",
        "id_prefix": "P",
        "dashboard_endpoint": "student_dashboard",
        "profile_fields": ("college", "roll_number", "phone"),
        "public_fields": (
            "participant_id", "full_name", "email", "college", "roll_number",
            "phone", "auth_provider", "profile_complete",
        ),
    },
    "organizer": {
        "label": "an Organizer",
        "csv": os.path.join(DATA_DIR, "organizers.csv"),
        "headers": ORGANIZER_HEADERS,
        "id_key": "organizer_id",
        "id_prefix": "O",
        "dashboard_endpoint": "organizer_dashboard",
        "profile_fields": ("organization_name", "committee_name", "phone"),
        "public_fields": (
            "organizer_id", "full_name", "email", "organization_name", "committee_name",
            "designation", "phone", "auth_provider", "profile_complete",
        ),
    },
}

CSV_SCHEMAS = {
    ROLES["participant"]["csv"]: PARTICIPANT_HEADERS,
    ROLES["organizer"]["csv"]: ORGANIZER_HEADERS,
    EVENTS_CSV: EVENT_HEADERS,
    REGISTRATIONS_CSV: REGISTRATION_HEADERS,
}

# ==================== CSV STORAGE ====================

# RLock so a handler can hold the lock across read -> modify -> write
# while read_csv / write_csv lock again inside it.
csv_lock = threading.RLock()


def read_csv(path):
    with csv_lock:
        if not os.path.exists(path):
            return []
        with open(path, "r", encoding="utf-8") as f:
            return list(csv.DictReader(f))


def write_csv(path, headers, rows):
    """Atomic write: a crash mid-write can't corrupt the file."""
    with csv_lock:
        fd, tmp_path = tempfile.mkstemp(dir=DATA_DIR, suffix=".tmp")
        with os.fdopen(fd, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=headers)
            writer.writeheader()
            writer.writerows(rows)
        os.replace(tmp_path, path)


def init_csv_files():
    with csv_lock:
        for path, headers in CSV_SCHEMAS.items():
            if not os.path.exists(path):
                write_csv(path, headers, [])


init_csv_files()

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


def read_users(role):
    return read_csv(ROLES[role]["csv"])


def user_id_of(user, role):
    return user[ROLES[role]["id_key"]]


def find_user_by_email(email):
    """Return (user, role) for the first match across both roles, else (None, None)."""
    wanted = email.strip().lower()
    for role in ROLES:
        for user in read_users(role):
            if user.get("email", "").strip().lower() == wanted:
                return user, role
    return None, None


def find_user_by_id(user_id, role):
    if role not in ROLES:
        return None
    id_key = ROLES[role]["id_key"]
    return next((u for u in read_users(role) if u.get(id_key) == user_id), None)


def next_user_id(role, rows):
    """P001, P002, ... / O001, O002, ..."""
    cfg = ROLES[role]
    prefix, id_key = cfg["id_prefix"], cfg["id_key"]
    numbers = [
        int(row[id_key][len(prefix):])
        for row in rows
        if row.get(id_key, "").startswith(prefix) and row[id_key][len(prefix):].isdigit()
    ]
    return f"{prefix}{max(numbers, default=0) + 1:03d}"


def create_user(role, **fields):
    """Append a new user row (blank for any field not given) and return it."""
    cfg = ROLES[role]
    with csv_lock:
        rows = read_csv(cfg["csv"])
        user = dict.fromkeys(cfg["headers"], "")
        user.update(profile_complete="false", created_at=now_iso(), last_login=now_iso())
        user.update(fields)
        user[cfg["id_key"]] = next_user_id(role, rows)
        rows.append(user)
        write_csv(cfg["csv"], cfg["headers"], rows)
    return user


def update_user(role, user_id, changes):
    cfg = ROLES[role]
    with csv_lock:
        rows = read_csv(cfg["csv"])
        for row in rows:
            if row[cfg["id_key"]] == user_id:
                row.update(changes)
                break
        write_csv(cfg["csv"], cfg["headers"], rows)


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


def role_mismatch_error(existing_role):
    return api_error(
        f"This email is registered as {ROLES[existing_role]['label']}. Please use the correct tab."
    )


def dashboard_url(role):
    return url_for(ROLES[role]["dashboard_endpoint"])


def landing_url(user, role):
    """Where a logged-in user should go next."""
    return dashboard_url(role) if is_profile_complete(user, role) else url_for("complete_profile")


def start_session(user, role):
    session["user_id"] = user_id_of(user, role)
    session["role"] = role


def login_required(view):
    @wraps(view)
    def wrapper(*args, **kwargs):
        if not session.get("user_id") or not session.get("role"):
            return redirect(url_for("index"))
        return view(*args, **kwargs)

    return wrapper


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
    if "@" not in email:
        return api_error("Please enter a valid email address.", field="email")
    if len(password) < MIN_PASSWORD_LENGTH:
        return api_error(f"Password must be at least {MIN_PASSWORD_LENGTH} characters long.", field="password")
    if password != confirm_password:
        return api_error("Passwords do not match.", field="confirm_password")

    with csv_lock:  # check + create together, so two signups can't use the same email
        existing_user, existing_role = find_user_by_email(email)
        if existing_user:
            if existing_role != role:
                return role_mismatch_error(existing_role)
            return api_error("An account with this email already exists. Please log in.")

        user = create_user(
            role,
            full_name=full_name,
            email=email,
            password_hash=generate_password_hash(password),
            auth_provider="password",
        )

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
        return role_mismatch_error(user_role)

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
        claims = google_id_token.verify_firebase_token(
            token, google_requests.Request(), audience=FIREBASE_PROJECT_ID
        )
    except Exception as exc:
        app.logger.warning("Google token verification failed: %s", exc)
        return api_error("Google token verification failed. Please try again.", 401)

    email = (claims.get("email") or "").strip().lower()
    name = claims.get("name", "Google User")
    google_uid = claims.get("sub") or claims.get("user_id", "")

    if not email:
        return api_error("Google account does not contain a verified email.")

    with csv_lock:
        existing_user, existing_role = find_user_by_email(email)

        if existing_user:
            if existing_role != role:
                return role_mismatch_error(existing_role)
            changes = {"last_login": now_iso()}
            if not existing_user.get("google_uid"):
                changes["google_uid"] = google_uid
            update_user(role, user_id_of(existing_user, role), changes)
            user = existing_user
        else:
            user = create_user(
                role, full_name=name, email=email,
                auth_provider="google", google_uid=google_uid,
            )

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

    with csv_lock:  # roll-number check + save together
        roll_taken = any(
            p.get("participant_id") != user_id and p.get("roll_number", "").strip().upper() == roll_number
            for p in read_users("participant")
        )
        if roll_taken:
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


# ==================== DASHBOARD APIS ====================

def is_checked_in(registration):
    return str(registration.get("checked_in", "0")) == "1"


@app.route("/api/participant/me")
@login_required
def api_participant_me():
    if session["role"] != "participant":
        return jsonify({"error": "Unauthorized"}), 403

    user = find_user_by_id(session["user_id"], "participant")
    if not user:
        return jsonify({"error": "User not found"}), 404

    email = user.get("email", "").strip().lower()
    my_regs = [r for r in read_csv(REGISTRATIONS_CSV) if r.get("email", "").strip().lower() == email]

    return jsonify({
        **pick(user, ROLES["participant"]["public_fields"]),
        "stats": {
            "events_registered": len(my_regs),
            "passes": len(my_regs),
            "checked_in": sum(is_checked_in(r) for r in my_regs),
        },
        "events": read_csv(EVENTS_CSV),
        "passes_list": my_regs,
    })


@app.route("/api/organizer/me")
@login_required
def api_organizer_me():
    if session["role"] != "organizer":
        return jsonify({"error": "Unauthorized"}), 403

    user_id = session["user_id"]
    user = find_user_by_id(user_id, "organizer")
    if not user:
        return jsonify({"error": "User not found"}), 404

    my_events = [e for e in read_csv(EVENTS_CSV) if e.get("organizer_id") == user_id]
    my_event_ids = {e.get("event_id") for e in my_events}
    my_regs = [r for r in read_csv(REGISTRATIONS_CSV) if r.get("event_id") in my_event_ids]

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


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "1") == "1"
    app.run(host="0.0.0.0", port=port, debug=debug)
