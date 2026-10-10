import os
import csv
import json
import threading
from datetime import datetime, timezone
from functools import wraps
from flask import Flask, request, jsonify, render_template, redirect, url_for, session
from werkzeug.security import generate_password_hash, check_password_hash
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests

app = Flask(__name__, template_folder='templates', static_folder='static')
app.secret_key = os.environ.get('SECRET_KEY', 'festgate_super_secret_jwt_gatekeeper_token_2026')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
os.makedirs(DATA_DIR, exist_ok=True)

PARTICIPANTS_CSV = os.path.join(DATA_DIR, 'participants.csv')
ORGANIZERS_CSV = os.path.join(DATA_DIR, 'organizers.csv')
EVENTS_CSV = os.path.join(DATA_DIR, 'events.csv')
REGISTRATIONS_CSV = os.path.join(DATA_DIR, 'registrations.csv')

csv_lock = threading.Lock()

PARTICIPANT_HEADERS = [
    'participant_id', 'full_name', 'email', 'college', 'roll_number',
    'phone', 'password_hash', 'auth_provider', 'google_uid',
    'profile_complete', 'created_at', 'last_login'
]

ORGANIZER_HEADERS = [
    'organizer_id', 'full_name', 'email', 'organization_name', 'committee_name',
    'designation', 'phone', 'password_hash', 'auth_provider', 'google_uid',
    'profile_complete', 'created_at', 'last_login'
]

EVENT_HEADERS = [
    'event_id', 'organizer_id', 'title', 'date', 'venue', 'description', 'capacity'
]

REGISTRATION_HEADERS = [
    'reg_id', 'event_id', 'name', 'email', 'ticket_code', 'checked_in', 'registered_at'
]

def init_csv_files():
    with csv_lock:
        if not os.path.exists(PARTICIPANTS_CSV):
            with open(PARTICIPANTS_CSV, 'w', newline='', encoding='utf-8') as f:
                csv.writer(f).writerow(PARTICIPANT_HEADERS)
        if not os.path.exists(ORGANIZERS_CSV):
            with open(ORGANIZERS_CSV, 'w', newline='', encoding='utf-8') as f:
                csv.writer(f).writerow(ORGANIZER_HEADERS)
        if not os.path.exists(EVENTS_CSV):
            with open(EVENTS_CSV, 'w', newline='', encoding='utf-8') as f:
                csv.writer(f).writerow(EVENT_HEADERS)
        if not os.path.exists(REGISTRATIONS_CSV):
            with open(REGISTRATIONS_CSV, 'w', newline='', encoding='utf-8') as f:
                csv.writer(f).writerow(REGISTRATION_HEADERS)

init_csv_files()

def read_csv(file_path):
    with csv_lock:
        if not os.path.exists(file_path):
            return []
        with open(file_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            return list(reader)

def write_csv(file_path, fieldnames, rows):
    with csv_lock:
        with open(file_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)

def find_user_by_email(email):
    clean_email = email.strip().lower()
    participants = read_csv(PARTICIPANTS_CSV)
    for p in participants:
        if p.get('email', '').strip().lower() == clean_email:
            return p, 'participant'
    
    organizers = read_csv(ORGANIZERS_CSV)
    for o in organizers:
        if o.get('email', '').strip().lower() == clean_email:
            return o, 'organizer'
            
    return None, None

def find_user_by_id(user_id, role):
    if role == 'participant':
        for p in read_csv(PARTICIPANTS_CSV):
            if p.get('participant_id') == user_id:
                return p
    elif role == 'organizer':
        for o in read_csv(ORGANIZERS_CSV):
            if o.get('organizer_id') == user_id:
                return o
    return None

def generate_id(role):
    if role == 'participant':
        rows = read_csv(PARTICIPANTS_CSV)
        max_num = 0
        for r in rows:
            pid = r.get('participant_id', '')
            if pid.startswith('P') and pid[1:].isdigit():
                max_num = max(max_num, int(pid[1:]))
        return f"P{max_num + 1:03d}"
    else:
        rows = read_csv(ORGANIZERS_CSV)
        max_num = 0
        for r in rows:
            oid = r.get('organizer_id', '')
            if oid.startswith('O') and oid[1:].isdigit():
                max_num = max(max_num, int(oid[1:]))
        return f"O{max_num + 1:03d}"

def is_profile_complete(user, role):
    if not user:
        return False
    pc = str(user.get('profile_complete', '')).lower()
    if pc == 'true':
        return True
    if role == 'participant':
        return bool(user.get('college') and user.get('roll_number') and user.get('phone'))
    elif role == 'organizer':
        return bool(user.get('organization_name') and user.get('committee_name') and user.get('phone'))
    return False

# ================= AUTH DECORATORS & ROUTE GUARDS =================
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_id = session.get('user_id')
        role = session.get('role')
        if not user_id or not role:
            return redirect(url_for('index'))
        return f(*args, **kwargs)
    return decorated_function

# ================= PAGES =================
@app.route('/')
def index():
    user_id = session.get('user_id')
    role = session.get('role')
    if user_id and role:
        user = find_user_by_id(user_id, role)
        if user:
            if not is_profile_complete(user, role):
                return redirect(url_for('complete_profile'))
            if role == 'participant':
                return redirect(url_for('student_dashboard'))
            elif role == 'organizer':
                return redirect(url_for('organizer_dashboard'))
    return render_template('index.html')

@app.route('/complete-profile')
@login_required
def complete_profile():
    user_id = session.get('user_id')
    role = session.get('role')
    user = find_user_by_id(user_id, role)
    if not user:
        session.clear()
        return redirect(url_for('index'))
    if is_profile_complete(user, role):
        return redirect(url_for('student_dashboard') if role == 'participant' else url_for('organizer_dashboard'))
    return render_template('complete_profile.html', user=user, role=role)

@app.route('/student/dashboard')
@login_required
def student_dashboard():
    user_id = session.get('user_id')
    role = session.get('role')
    if role != 'participant':
        return redirect(url_for('organizer_dashboard'))
    user = find_user_by_id(user_id, role)
    if not user or not is_profile_complete(user, role):
        return redirect(url_for('complete_profile'))
    return render_template('participant_dashboard.html', user=user)

@app.route('/organizer/dashboard')
@login_required
def organizer_dashboard():
    user_id = session.get('user_id')
    role = session.get('role')
    if role != 'organizer':
        return redirect(url_for('student_dashboard'))
    user = find_user_by_id(user_id, role)
    if not user or not is_profile_complete(user, role):
        return redirect(url_for('complete_profile'))
    return render_template('organizer_dashboard.html', user=user)

# ================= AUTH APIS =================
@app.route('/api/auth/signup', methods=['POST'])
def api_signup():
    data = request.get_json() or {}
    role = data.get('role', 'participant').strip().lower()
    full_name = data.get('full_name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    confirm_password = data.get('confirm_password', '')

    if role not in ['participant', 'organizer']:
        return jsonify({'success': False, 'message': 'Invalid role specified.'}), 400

    if not full_name:
        return jsonify({'success': False, 'message': 'Please enter your full name.', 'field': 'full_name'}), 400

    if not email or '@' not in email:
        return jsonify({'success': False, 'message': 'Please enter a valid email address.', 'field': 'email'}), 400

    if not password or len(password) < 8:
        return jsonify({'success': False, 'message': 'Password must be at least 8 characters long.', 'field': 'password'}), 400

    if password != confirm_password:
        return jsonify({'success': False, 'message': 'Passwords do not match.', 'field': 'confirm_password'}), 400

    existing_user, existing_role = find_user_by_email(email)
    if existing_user:
        if existing_role != role:
            other_title = 'Organizer' if existing_role == 'organizer' else 'Participant'
            return jsonify({
                'success': False,
                'message': f"This email is registered as an {other_title}. Please use the correct tab."
            }), 400
        else:
            return jsonify({'success': False, 'message': 'An account with this email already exists. Please log in.'}), 400

    # Create user
    now_iso = datetime.now(timezone.utc).isoformat()
    new_id = generate_id(role)
    pwd_hash = generate_password_hash(password)

    if role == 'participant':
        rows = read_csv(PARTICIPANTS_CSV)
        new_row = {
            'participant_id': new_id,
            'full_name': full_name,
            'email': email,
            'college': '',
            'roll_number': '',
            'phone': '',
            'password_hash': pwd_hash,
            'auth_provider': 'password',
            'google_uid': '',
            'profile_complete': 'false',
            'created_at': now_iso,
            'last_login': now_iso
        }
        rows.append(new_row)
        write_csv(PARTICIPANTS_CSV, PARTICIPANT_HEADERS, rows)
    else:
        rows = read_csv(ORGANIZERS_CSV)
        new_row = {
            'organizer_id': new_id,
            'full_name': full_name,
            'email': email,
            'organization_name': '',
            'committee_name': '',
            'designation': '',
            'phone': '',
            'password_hash': pwd_hash,
            'auth_provider': 'password',
            'google_uid': '',
            'profile_complete': 'false',
            'created_at': now_iso,
            'last_login': now_iso
        }
        rows.append(new_row)
        write_csv(ORGANIZERS_CSV, ORGANIZER_HEADERS, rows)

    session['user_id'] = new_id
    session['role'] = role

    return jsonify({
        'success': True,
        'message': 'Account created successfully!',
        'redirect_url': '/complete-profile'
    })

@app.route('/api/auth/login', methods=['POST'])
def api_login():
    data = request.get_json() or {}
    role = data.get('role', 'participant').strip().lower()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'success': False, 'message': 'Email and password are required.'}), 400

    user, user_role = find_user_by_email(email)
    if not user:
        return jsonify({'success': False, 'message': 'No account found with this email address.'}), 404

    if user_role != role:
        other_title = 'Organizer' if user_role == 'organizer' else 'Participant'
        return jsonify({
            'success': False,
            'message': f"This email is registered as an {other_title}. Please use the correct tab."
        }), 400

    # Verify password hash
    stored_hash = user.get('password_hash', '')
    if not stored_hash or not check_password_hash(stored_hash, password):
        return jsonify({'success': False, 'message': 'Invalid password. Please check and try again.', 'field': 'password'}), 401

    # Update last_login
    user_id_key = 'participant_id' if role == 'participant' else 'organizer_id'
    user_id = user[user_id_key]
    csv_file = PARTICIPANTS_CSV if role == 'participant' else ORGANIZERS_CSV
    headers = PARTICIPANT_HEADERS if role == 'participant' else ORGANIZER_HEADERS
    rows = read_csv(csv_file)
    for r in rows:
        if r[user_id_key] == user_id:
            r['last_login'] = datetime.now(timezone.utc).isoformat()
            break
    write_csv(csv_file, headers, rows)

    session['user_id'] = user_id
    session['role'] = role

    if not is_profile_complete(user, role):
        redirect_url = '/complete-profile'
    else:
        redirect_url = '/student/dashboard' if role == 'participant' else '/organizer/dashboard'

    return jsonify({
        'success': True,
        'message': 'Logged in successfully!',
        'redirect_url': redirect_url
    })

@app.route('/api/auth/google', methods=['POST'])
def api_google_auth():
    data = request.get_json() or {}
    id_token_str = data.get('id_token')
    selected_role = data.get('role', 'participant').strip().lower()

    if not id_token_str:
        return jsonify({'success': False, 'message': 'Missing Firebase ID token.'}), 400

    if selected_role not in ['participant', 'organizer']:
        return jsonify({'success': False, 'message': 'Invalid role.'}), 400

    # Server-side verification
    try:
        req = google_requests.Request()
        decoded_token = google_id_token.verify_firebase_token(
            id_token_str,
            req,
            audience="festgate-a1f30"
        )
    except Exception as e:
        return jsonify({'success': False, 'message': f'Google token verification failed: {str(e)}'}), 401

    google_email = decoded_token.get('email', '').strip().lower()
    google_name = decoded_token.get('name', 'Google User')
    google_uid = decoded_token.get('sub', decoded_token.get('user_id', ''))

    if not google_email:
        return jsonify({'success': False, 'message': 'Google account does not contain a verified email.'}), 400

    existing_user, existing_role = find_user_by_email(google_email)
    now_iso = datetime.now(timezone.utc).isoformat()

    if existing_user:
        if existing_role != selected_role:
            other_title = 'Organizer' if existing_role == 'organizer' else 'Participant'
            return jsonify({
                'success': False,
                'message': f"This email is registered as an {other_title}. Please use the correct tab."
            }), 400

        user_id_key = 'participant_id' if selected_role == 'participant' else 'organizer_id'
        user_id = existing_user[user_id_key]
        csv_file = PARTICIPANTS_CSV if selected_role == 'participant' else ORGANIZERS_CSV
        headers = PARTICIPANT_HEADERS if selected_role == 'participant' else ORGANIZER_HEADERS
        rows = read_csv(csv_file)
        for r in rows:
            if r[user_id_key] == user_id:
                r['last_login'] = now_iso
                if not r.get('google_uid'):
                    r['google_uid'] = google_uid
                break
        write_csv(csv_file, headers, rows)
        user = existing_user
    else:
        # Create new user via Google
        user_id = generate_id(selected_role)
        if selected_role == 'participant':
            rows = read_csv(PARTICIPANTS_CSV)
            user = {
                'participant_id': user_id,
                'full_name': google_name,
                'email': google_email,
                'college': '',
                'roll_number': '',
                'phone': '',
                'password_hash': '',
                'auth_provider': 'google',
                'google_uid': google_uid,
                'profile_complete': 'false',
                'created_at': now_iso,
                'last_login': now_iso
            }
            rows.append(user)
            write_csv(PARTICIPANTS_CSV, PARTICIPANT_HEADERS, rows)
        else:
            rows = read_csv(ORGANIZERS_CSV)
            user = {
                'organizer_id': user_id,
                'full_name': google_name,
                'email': google_email,
                'organization_name': '',
                'committee_name': '',
                'designation': '',
                'phone': '',
                'password_hash': '',
                'auth_provider': 'google',
                'google_uid': google_uid,
                'profile_complete': 'false',
                'created_at': now_iso,
                'last_login': now_iso
            }
            rows.append(user)
            write_csv(ORGANIZERS_CSV, ORGANIZER_HEADERS, rows)

    session['user_id'] = user_id
    session['role'] = selected_role

    if not is_profile_complete(user, selected_role):
        redirect_url = '/complete-profile'
    else:
        redirect_url = '/student/dashboard' if selected_role == 'participant' else '/organizer/dashboard'

    return jsonify({
        'success': True,
        'message': f'Signed in as {google_email}!',
        'redirect_url': redirect_url
    })

@app.route('/api/profile/complete', methods=['POST'])
@login_required
def api_complete_profile():
    user_id = session.get('user_id')
    role = session.get('role')
    data = request.get_json() or {}

    phone = data.get('phone', '').strip()
    if not (phone.isdigit() and len(phone) == 10):
        return jsonify({'success': False, 'message': 'Phone number must be exactly 10 digits.', 'field': 'phone'}), 400

    if role == 'participant':
        college = data.get('college', '').strip()
        roll_number = data.get('roll_number', '').strip().upper()

        if not college:
            return jsonify({'success': False, 'message': 'College Name is required.', 'field': 'college'}), 400
        if not roll_number:
            return jsonify({'success': False, 'message': 'Roll Number is required.', 'field': 'roll_number'}), 400

        # Unique roll number check
        participants = read_csv(PARTICIPANTS_CSV)
        for p in participants:
            if p.get('participant_id') != user_id and p.get('roll_number', '').strip().upper() == roll_number:
                return jsonify({'success': False, 'message': 'This Roll Number is already registered by another participant.', 'field': 'roll_number'}), 400

        for p in participants:
            if p.get('participant_id') == user_id:
                p['college'] = college
                p['roll_number'] = roll_number
                p['phone'] = phone
                p['profile_complete'] = 'true'
                break
        write_csv(PARTICIPANTS_CSV, PARTICIPANT_HEADERS, participants)
        return jsonify({
            'success': True,
            'message': 'Profile completed successfully!',
            'redirect_url': '/student/dashboard'
        })

    elif role == 'organizer':
        organization_name = data.get('organization_name', '').strip()
        committee_name = data.get('committee_name', '').strip()
        designation = data.get('designation', '').strip()

        if not organization_name:
            return jsonify({'success': False, 'message': 'College / Organization Name is required.', 'field': 'organization_name'}), 400
        if not committee_name:
            return jsonify({'success': False, 'message': 'Committee or Department Name is required.', 'field': 'committee_name'}), 400

        organizers = read_csv(ORGANIZERS_CSV)
        for o in organizers:
            if o.get('organizer_id') == user_id:
                o['organization_name'] = organization_name
                o['committee_name'] = committee_name
                o['designation'] = designation
                o['phone'] = phone
                o['profile_complete'] = 'true'
                break
        write_csv(ORGANIZERS_CSV, ORGANIZER_HEADERS, organizers)
        return jsonify({
            'success': True,
            'message': 'Profile completed successfully!',
            'redirect_url': '/organizer/dashboard'
        })

    return jsonify({'success': False, 'message': 'Invalid role.'}), 400

@app.route('/api/logout', methods=['POST'])
def api_logout():
    session.clear()
    return jsonify({'success': True, 'redirect_url': '/'})

# ================= USER PROFILE & DASHBOARD APIS =================
@app.route('/api/participant/me', methods=['GET'])
@login_required
def api_participant_me():
    user_id = session.get('user_id')
    role = session.get('role')
    if role != 'participant':
        return jsonify({'error': 'Unauthorized'}), 403

    user = find_user_by_id(user_id, 'participant')
    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Calculate stats from registrations.csv and events.csv
    user_email = user.get('email', '').strip().lower()
    registrations = read_csv(REGISTRATIONS_CSV)
    user_regs = [r for r in registrations if r.get('email', '').strip().lower() == user_email]

    events = read_csv(EVENTS_CSV)
    events_registered_count = len(user_regs)
    checked_in_count = sum(1 for r in user_regs if str(r.get('checked_in', '0')) == '1')
    passes_count = events_registered_count

    safe_profile = {
        'participant_id': user.get('participant_id'),
        'full_name': user.get('full_name'),
        'email': user.get('email'),
        'college': user.get('college'),
        'roll_number': user.get('roll_number'),
        'phone': user.get('phone'),
        'auth_provider': user.get('auth_provider'),
        'profile_complete': user.get('profile_complete'),
        'stats': {
            'events_registered': events_registered_count,
            'passes': passes_count,
            'checked_in': checked_in_count
        },
        'events': events,
        'passes_list': user_regs
    }
    return jsonify(safe_profile)

@app.route('/api/organizer/me', methods=['GET'])
@login_required
def api_organizer_me():
    user_id = session.get('user_id')
    role = session.get('role')
    if role != 'organizer':
        return jsonify({'error': 'Unauthorized'}), 403

    user = find_user_by_id(user_id, 'organizer')
    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Calculate stats from events.csv and registrations.csv for this organizer
    events = read_csv(EVENTS_CSV)
    org_events = [e for e in events if e.get('organizer_id') == user_id]
    org_event_ids = {e.get('event_id') for e in org_events}

    registrations = read_csv(REGISTRATIONS_CSV)
    org_regs = [r for r in registrations if r.get('event_id') in org_event_ids]

    total_registrations = len(org_regs)
    checked_in = sum(1 for r in org_regs if str(r.get('checked_in', '0')) == '1')
    total_capacity = sum(int(e.get('capacity', 0) or 0) for e in org_events)
    capacity_used = f"{(total_registrations / total_capacity * 100):.1f}%" if total_capacity > 0 else "0%"

    safe_profile = {
        'organizer_id': user.get('organizer_id'),
        'full_name': user.get('full_name'),
        'email': user.get('email'),
        'organization_name': user.get('organization_name'),
        'committee_name': user.get('committee_name'),
        'designation': user.get('designation'),
        'phone': user.get('phone'),
        'auth_provider': user.get('auth_provider'),
        'profile_complete': user.get('profile_complete'),
        'stats': {
            'total_registrations': total_registrations,
            'checked_in': checked_in,
            'capacity_used': capacity_used
        },
        'events': org_events
    }
    return jsonify(safe_profile)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
