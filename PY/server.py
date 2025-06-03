from flask import Flask, request, jsonify, redirect, send_from_directory, make_response
from flask_cors import CORS
import os
import bcrypt
import sqlite3
import requests
import json
import time
import pytz
from datetime import datetime

app = Flask(__name__)
CORS(app, supports_credentials=True)

# Define the path to the .txt files
USER_LOGIN_PATH = os.path.join(os.path.dirname(__file__), '../Resources/logInList.db')
ADMIN_LOGIN_PATH = os.path.join(os.path.dirname(__file__), '../Resources/adminLoginList.db')
OPT_IN_REQUESTS_FILE = os.path.join(os.path.dirname(__file__), '../Resources/optInRequests.json')
EVENTS_DB_PATH = os.path.join(os.path.dirname(__file__), '../Resources/events.db')
EVENT_REQUESTS_DB_PATH = os.path.join(os.path.dirname(__file__), '../Resources/eventRequests.db')
ANNOUNCEMENTS_DB_PATH = os.path.join(os.path.dirname(__file__), '../Resources/announcements.db')

# Create tables if not exist
def init_announcements_db():
    conn = sqlite3.connect(ANNOUNCEMENTS_DB_PATH)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS announcements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            author TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            announcement_id INTEGER NOT NULL,
            commenter TEXT NOT NULL,
            comment TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (announcement_id) REFERENCES announcements(id)
        )
    ''')
    conn.commit()
    conn.close()

init_announcements_db()

# Serve static files (HTML, CSS, JS, etc.)
@app.route('/<path:filename>')
def serve_static_files(filename):
    return send_from_directory(os.path.join(os.path.dirname(__file__), '../'), filename)

@app.route('/api/save-event', methods=['POST'])
def save_event():
    # Get form data
    user_name = request.form.get('name')
    email = request.form.get('email')
    date = request.form.get('date').replace('-', ',')
    event_name = request.form.get('EventName')
    location = request.form.get('Location')
    start_time = request.form.get('Stime')
    end_time = request.form.get('Etime')
    people = request.form.get('people')
    volunteer_hours = request.form.get('VolHours')
    try:
        # Connect to the events database
        conn = sqlite3.connect(EVENTS_DB_PATH)
        cursor = conn.cursor()
        # Create the events table if it doesn't exist
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL,
                name TEXT NOT NULL,
                location TEXT NOT NULL,
                start_time TEXT NOT NULL,
                end_time TEXT NOT NULL,
                people TEXT,
                volunteer_hours TEXT
            )
        ''')
        # Insert the new event
        cursor.execute('''
            INSERT INTO events (date, name, location, start_time, end_time, people, volunteer_hours)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (date, event_name, location, start_time, end_time, people, volunteer_hours))
        conn.commit()
        conn.close()
        print("Event saved to database successfully!")
        return f"Event saved successfully!", 200
    except Exception as e:
        print(f"Error saving event to database: {e}")
        return f"Internal Server Error: {e}", 500

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    user_type = data.get('type')

    if not username or not password or not user_type:
        return jsonify({"error": "Missing username, password, or user type"}), 400

    # Select the appropriate database based on user type
    login_path = USER_LOGIN_PATH if user_type == 'user' else ADMIN_LOGIN_PATH

    try:
        # Connect to the database
        conn = sqlite3.connect(login_path)
        cursor = conn.cursor()

        # Query the database for the user
        if user_type == 'user':
            cursor.execute('SELECT password FROM users WHERE username = ?', (username,))
            result = cursor.fetchone()
        else:
            cursor.execute('SELECT password FROM admin_users WHERE username = ?', (username,))
            result = cursor.fetchone()
        conn.close()

        if result and bcrypt.checkpw(password.encode('utf-8'), result[0].encode('utf-8')):
            # Set a cookie for successful login
            response = make_response(jsonify({"success": True, "message": "Login successful"}))
            cookie_name = 'loggedInUser' if user_type == 'user' else 'loggedInAdmin'
            response.set_cookie(cookie_name, username, max_age=3600, path='/')
            return response

        return jsonify({"error": "Invalid username or password"}), 401
    except Exception as e:
        print(f"Error during login: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/api/cookies', methods=['POST'])
def handle_cookies():
    data = request.json
    consent = data.get('consent')  # 'accept' or 'reject'

    if consent == 'accept':
        response = make_response(jsonify({"success": True, "message": "Cookies accepted"}))
        response.set_cookie('cookiesAccepted', 'true', max_age=3600 * 24 * 100, path='/')  # 100 days
        return response
    elif consent == 'reject':
        return jsonify({"success": True, "message": "Cookies rejected"}), 200
    else:
        return jsonify({"error": "Invalid consent value"}), 400

@app.route('/remove-member', methods=['POST'])
def remove_member():
    member_to_remove = request.json.get('member', '').strip()
    if not member_to_remove:
        return jsonify({"error": "Member name is required"}), 400

    try:
        # Remove the member from the USER_LOGIN_PATH database only
        conn = sqlite3.connect(USER_LOGIN_PATH)
        cursor = conn.cursor()
        cursor.execute('DELETE FROM users WHERE username = ?', (member_to_remove,))
        conn.commit()
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({"error": f"Member '{member_to_remove}' not found in the login database"}), 404
        conn.close()
        print(f"Member '{member_to_remove}' removed from the login database successfully!")

        # Remove the member's data from optInRequests.json
        try:
            opt_in_requests = read_opt_in_requests()
            if member_to_remove in opt_in_requests:
                del opt_in_requests[member_to_remove]
                write_opt_in_requests(opt_in_requests)
                print(f"Removed '{member_to_remove}' from optInRequests.json")
        except Exception as e:
            print(f"Error removing member from optInRequests.json: {e}")

        return jsonify({"success": True, "message": f"Member '{member_to_remove}' removed successfully!"}), 200
    except sqlite3.Error as e:
        print(f"Database error: {e}")
        return jsonify({"error": "Database error"}), 500
    except Exception as e:
        print(f"Error removing member: {e}")
        return jsonify({"error": "Internal Server Error"}), 500

@app.route('/add-member', methods=['POST'])
def add_member():
    username = request.json.get('username')
    job = request.json.get('job')
    password = request.json.get('password')
    email = request.json.get('email')

    if not username or not job or not password or not email:
        return jsonify({"error": "Username, job, password, and email are required"}), 400

    try:
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

        # Add the member to the USER_LOGIN_PATH database with job
        conn = sqlite3.connect(USER_LOGIN_PATH)
        cursor = conn.cursor()
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            job TEXT NOT NULL
        )
        ''')
        cursor.execute('INSERT INTO users (username, password, email, job) VALUES (?, ?, ?, ?)', 
                       (username, hashed_password, email, job))
        conn.commit()
        conn.close()

        print(f"Member '{username}' added to the login database successfully!")
        return jsonify({"success": True, "message": "Member added successfully!"}), 200
    except sqlite3.IntegrityError:
        return jsonify({"error": "Username or email already exists"}), 400
    except Exception as e:
        print(f"Error adding member: {e}")
        return jsonify({"error": "Internal Server Error"}), 500

@app.route('/api/get-members', methods=['GET'])
def get_members():
    try:
        conn = sqlite3.connect(USER_LOGIN_PATH)
        cursor = conn.cursor()
        cursor.execute('SELECT username, job FROM users')
        members = cursor.fetchall()
        conn.close()
        member_list = [{"username": m[0], "job": m[1]} for m in members]
        return jsonify(member_list), 200
    except Exception as e:
        print(f"Error fetching members: {e}")
        return jsonify({"error": "Internal Server Error"}), 500

@app.route('/api/getEvent', methods=['GET'])
def get_event():
    event_id = request.args.get('id')
    if not event_id:
        return "Event ID is required", 400

    try:
        conn = sqlite3.connect(EVENTS_DB_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            SELECT id, date, name, start_time, end_time, location, people, volunteer_hours
            FROM events WHERE id = ?
        ''', (event_id,))
        row = cursor.fetchone()
        conn.close()

        if row:
            event = {
                "id": row[0],
                "date": row[1],
                "name": row[2],
                "startTime": row[3],
                "endTime": row[4],
                "location": row[5],
                "TCP": row[6],
                "voulenteerHours": row[7],
            }
            return jsonify(event)
        else:
            return "Event not found", 404
    except Exception as e:
        return f"Error reading event: {str(e)}", 500

@app.route('/api/updateEvent', methods=['POST'])
def update_event():
    updated_event = request.json
    if not updated_event or 'id' not in updated_event:
        return "Invalid event data", 400

    try:
        conn = sqlite3.connect(EVENTS_DB_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE events
            SET date = ?, name = ?, start_time = ?, end_time = ?, location = ?, people = ?, volunteer_hours = ?
            WHERE id = ?
        ''', (
            updated_event['date'],
            updated_event['name'],
            updated_event['startTime'],
            updated_event['endTime'],
            updated_event['location'],
            updated_event['TCP'],
            updated_event['voulenteerHours'],
            updated_event['id']
        ))
        conn.commit()
        updated_rows = cursor.rowcount
        conn.close()

        if updated_rows == 0:
            return "Event not found", 404

        return "Event updated successfully", 200
    except Exception as e:
        return f"Error updating event: {str(e)}", 500

@app.route('/api/signout', methods=['POST'])
def sign_out():
    # Clear the authentication cookies
    response = make_response(jsonify({"success": True, "message": "Signed out successfully"}))
    response.set_cookie('loggedInUser', '', max_age=0, path='/')  # Clear user cookie
    response.set_cookie('loggedInAdmin', '', max_age=0, path='/')  # Clear admin cookie
    return response

@app.errorhandler(404)
def page_not_found(e):
    # Serve a custom 404 HTML page
    return send_from_directory(os.path.join(os.path.dirname(__file__), '../'), '404.html'), 404

@app.route('/remove_event', methods=['POST'])
def remove_event():
    event_id = request.json.get('id')
    if not event_id:
        return jsonify({"error": "Event ID is required"}), 400

    try:
        # Remove the event from the events database
        conn = sqlite3.connect(EVENTS_DB_PATH)
        cursor = conn.cursor()
        cursor.execute('DELETE FROM events WHERE id = ?', (event_id,))
        conn.commit()
        conn.close()

        # Remove the event from all users' optInRequests.json
        try:
            opt_in_requests = read_opt_in_requests()
            changed = False
            for user, events in opt_in_requests.items():
                # Remove any event with matching id or name
                new_events = [e for e in events if str(e.get('id')) != str(event_id) and e.get('name') != request.json.get('name')]
                if len(new_events) != len(events):
                    opt_in_requests[user] = new_events
                    changed = True
            if changed:
                write_opt_in_requests(opt_in_requests)
        except Exception as e:
            print(f"Error removing event from optInRequests.json: {e}")

        return jsonify({"success": True, "message": "Event removed successfully!"}), 200
    except Exception as e:
        print(f"Error removing event: {e}")
        return jsonify({"error": "Internal Server Error"}), 500

@app.route('/api/validate-and-send-reset-email', methods=['POST'])
def validate_and_send_reset_email():
    data = request.json
    email = data.get('email')
    username = data.get('username')

    if not email or not username:
        return jsonify({"error": "Email and username are required"}), 400

    try:
        # Connect to the database
        conn = sqlite3.connect(USER_LOGIN_PATH)
        cursor = conn.cursor()
        cursor.execute('SELECT email FROM users WHERE username = ?', (username,))
        result = cursor.fetchone()
        conn.close()

        if not result:
            return jsonify({"error": "Username not found"}), 404
        if result[0] != email:
            return jsonify({"error": "Email does not match the username"}), 400

        # Generate code and store it with expiry (10 min)
        code = str(int(time.time() * 1000))[-6:]  # 6-digit code, or use random
        expires = int(time.time()) + 600  # 10 minutes from now
        reset_codes[username] = {"code": code, "expires": expires, "email": email}

        # Send the email
        email_service_url = "http://localhost:6420/send-reset-email"
        email_payload = {
            "email": email,
            "username": username,
            "resetCode": code
        }
        email_response = requests.post(email_service_url, json=email_payload)

        if email_response.status_code == 200:
            return jsonify({"success": True, "message": "Password reset email sent successfully!"}), 200
        else:
            return jsonify({"error": "Failed to send email"}), email_response.status_code

    except sqlite3.Error as e:
        print(f"Database error: {e}")
        return jsonify({"error": "Database error"}), 500
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/api/update-password', methods=['POST'])
def update_password():
    data = request.json
    username = data.get('username')
    email = data.get('email')
    new_password = data.get('newPassword')
    code = data.get('code')

    if not username or not email or not new_password or not code:
        if not username:
            return jsonify({"error": "Username is required"}), 471
        if not email:
            return jsonify({"error": "Email is required"}), 472
        if not new_password:
            return jsonify({"error": "New password is required"}), 473
        if not code:
            return jsonify({"error": "Code is required"}), 474
        return jsonify({"error": "Username, email, new password, and code are required"}), 470

    entry = reset_codes.get(username)
    if not entry or entry['code'] != code or int(time.time()) > entry['expires']:
        return jsonify({"error": "Invalid or expired code"}), 401

    try:
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), salt).decode('utf-8')
        conn = sqlite3.connect(USER_LOGIN_PATH)
        cursor = conn.cursor()
        cursor.execute('UPDATE users SET password = ? WHERE username = ? AND email = ?', (hashed_password, username, email))
        conn.commit()
        updated_rows = cursor.rowcount
        conn.close()

        if updated_rows == 0:
            return jsonify({"error": "User not found or email does not match"}), 404

        reset_codes.pop(username, None)  # Remove code after successful reset
        return jsonify({"success": True, "message": "Password updated successfully!"}), 200
    except Exception as e:
        print(f"Error updating password: {e}")
        return jsonify({"error": "Internal server error"}), 500

# Function to safely read the opt-in requests JSON file
def read_opt_in_requests():
    try:
        with open(OPT_IN_REQUESTS_FILE, 'r') as file:
            return json.load(file)
    except FileNotFoundError:
        return {}  # Return an empty dictionary if the file doesn't exist
    except json.JSONDecodeError:
        return {}  # Return an empty dictionary if the file is malformed

# Function to safely write to the opt-in requests JSON file
def write_opt_in_requests(data):
    try:
        with open(OPT_IN_REQUESTS_FILE, 'w') as file:
            json.dump(data, file, indent=4)
    except Exception as e:
        print(f"Error writing to opt-in requests file: {e}")

# Endpoint to fetch all opt-in requests for admin
@app.route('/admin/opt-in-requests', methods=['GET'])
def get_opt_in_requests():
    try:
        opt_in_requests = read_opt_in_requests()
        return jsonify(opt_in_requests), 200
    except Exception as e:
        print(f"Error fetching opt-in requests: {e}")
        return jsonify({"error": "Internal server error"}), 500

# Endpoint to approve or deny an opt-in request
@app.route('/admin/update-opt-in', methods=['POST'])
def update_opt_in_request():
    data = request.json
    user_id = data.get('userId')
    event_name = data.get('eventName')
    action = data.get('action')  # 'approve' or 'deny'

    if not user_id or not event_name or not action:
        return jsonify({"error": "Missing userId, eventName, or action"}), 400

    try:
        opt_in_requests = read_opt_in_requests()

        if user_id in opt_in_requests:
            # Find the event in the user's opt-in requests
            for event in opt_in_requests[user_id]:
                if event['name'] == event_name:
                    if action == 'approve':
                        event['status'] = 'approved'
                    elif action == 'deny':
                        opt_in_requests[user_id].remove(event)
                    break
            else:
                return jsonify({"error": "Event not found"}), 404

            # Write the updated data back to the file
            write_opt_in_requests(opt_in_requests)
            return jsonify({"message": f"Opt-in request {action}d successfully"}), 200

        return jsonify({"error": "User not found"}), 404
    except Exception as e:
        print(f"Error updating opt-in request: {e}")
        return jsonify({"error": "Internal server error"}), 500

# In-memory store for reset codes
reset_codes = {}  # {username: {"code": ..., "expires": ..., "email": ...}}

# Endpoint to request a password reset
@app.route('/api/request-password-reset', methods=['POST'])
def request_password_reset():
    data = request.json
    username = data.get('username')
    email = data.get('email')

    if not username or not email:
        return jsonify({"error": "Username and email are required"}), 400

    try:
        # Connect to the database
        conn = sqlite3.connect(USER_LOGIN_PATH)
        cursor = conn.cursor()

        # Check if the user exists
        cursor.execute('SELECT email FROM users WHERE username = ?', (username,))
        result = cursor.fetchone()
        conn.close()

        if not result:
            return jsonify({"error": "User not found"}), 404

        if result[0] != email:
            return jsonify({"error": "Email does not match the username"}), 400

        # Generate a reset code and expiration time
        reset_code = str(bcrypt.gensalt()).split('$')[-1]  # Use a part of the salt as the reset code
        expires = int(time.time()) + 600  # 10 minutes from now

        # Store the reset code and expiration in memory
        reset_codes[username] = {"code": reset_code, "expires": expires, "email": email}

        # Send the reset code to the user's email (simulated here as a response)
        return jsonify({"success": True, "message": "Password reset code sent to email", "resetCode": reset_code}), 200
    except Exception as e:
        print(f"Error requesting password reset: {e}")
        return jsonify({"error": "Internal server error"}), 500

# Endpoint to validate the reset code
@app.route('/api/validate-reset-code', methods=['POST'])
def validate_reset_code():
    data = request.json
    username = data.get('username')
    reset_code = data.get('resetCode')

    if not username or not reset_code:
        return jsonify({"error": "Username and reset code are required"}), 400

    try:
        # Check if the reset code exists and is not expired
        if username in reset_codes:
            code_info = reset_codes[username]
            if code_info["code"] == reset_code and code_info["expires"] > int(time.time()):
                return jsonify({"success": True, "message": "Reset code is valid"}), 200
            else:
                return jsonify({"error": "Invalid or expired reset code"}), 400
        else:
            return jsonify({"error": "Reset code not found"}), 404
    except Exception as e:
        print(f"Error validating reset code: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/api/verify-reset-code', methods=['POST'])
def verify_reset_code():
    data = request.json
    username = data.get('username')
    code = data.get('code')

    if not username or not code:
        return jsonify({"error": "Username and code are required"}), 400

    entry = reset_codes.get(username)
    if not entry:
        return jsonify({"error": "No reset code found for this user"}), 404

    if int(time.time()) > entry['expires']:
        reset_codes.pop(username, None)
        return jsonify({"error": "Code expired"}), 400

    if code != entry['code']:
        return jsonify({"error": "Invalid code"}), 400

    return jsonify({"success": True}), 200

@app.route('/api/events', methods=['GET'])
def get_all_events():
    try:
        conn = sqlite3.connect(EVENTS_DB_PATH)
        cursor = conn.cursor()
        # Pull all relevant columns
        cursor.execute('SELECT id, name, date, location, start_time, end_time, people, volunteer_hours FROM events')
        events = cursor.fetchall()
        conn.close()
        event_list = [
            {
                "id": row[0],
                "name": row[1],
                "date": row[2],
                "location": row[3],
                "startTime": row[4],
                "endTime": row[5],
                "people": row[6],
                "volunteerHours": row[7]
            }
            for row in events
        ]
        return jsonify(event_list), 200
    except Exception as e:
        print(f"Error fetching events: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/api/events-by-date', methods=['GET'])
def get_events_by_date():
    date = request.args.get('date')  # Expecting format: YYYY-MM-DD
    if not date:
        return jsonify([])

    try:
        conn = sqlite3.connect(EVENTS_DB_PATH)
        cursor = conn.cursor()
        # Convert 'YYYY-MM-DD' to 'YYYY,MM,DD'
        db_date = date.replace('-', ',')
        cursor.execute('''
            SELECT id, name, date, location, start_time, end_time, people, volunteer_hours
            FROM events
            WHERE date = ?
        ''', (db_date,))
        rows = cursor.fetchall()
        conn.close()
        events = [
            {
                "id": row[0],
                "name": row[1],
                "date": row[2],
                "location": row[3],
                "startTime": row[4],
                "endTime": row[5],
                "people": row[6],
                "volunteerHours": row[7]
            }
            for row in rows
        ]
        return jsonify(events)
    except Exception as e:
        print(f"Error fetching events by date: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/submit-booking', methods=['POST'])
def submit_booking():
    # Get form data
    user_name = request.form.get('name')
    email = request.form.get('email')
    date = request.form.get('date')
    start_time = request.form.get('Stime')
    end_time = request.form.get('Etime')
    location = request.form.get('location')
    people = request.form.get('people')
    volunteer_hours = request.form.get('VolHours')

    try:
        # Connect to the eventRequests database
        conn = sqlite3.connect(EVENT_REQUESTS_DB_PATH)
        cursor = conn.cursor()
        # Create the event_requests table if it doesn't exist
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS event_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                date TEXT NOT NULL,
                start_time TEXT NOT NULL,
                end_time TEXT NOT NULL,
                location TEXT NOT NULL,
                people TEXT,
                volunteer_hours TEXT
            )
        ''')
        # Insert the new event request
        cursor.execute('''
            INSERT INTO event_requests (name, email, date, start_time, end_time, location, people, volunteer_hours)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (user_name, email, date, start_time, end_time, location, people, volunteer_hours))
        conn.commit()
        conn.close()
        print("Event request saved to eventRequests.db successfully!")
        # Show a popup and redirect
        return '''
            <script>
                alert("Event saved successfully!");
                window.location.href = "/UserPage/UserPage.html";
            </script>
        '''
    except Exception as e:
        print(f"Error saving event request: {e}")
        return "Internal Server Error", 500

@app.route('/api/event-requests', methods=['GET'])
def api_event_requests():
    try:
        conn = sqlite3.connect(EVENT_REQUESTS_DB_PATH)
        cursor = conn.cursor()
        cursor.execute('SELECT id, name, email, date, start_time, end_time, location, people, volunteer_hours FROM event_requests')
        rows = cursor.fetchall()
        conn.close()
        requests = [
            {
                "id": row[0],
                "name": row[1],
                "email": row[2],
                "date": row[3],
                "start_time": row[4],
                "end_time": row[5],
                "location": row[6],
                "people": row[7],
                "volunteer_hours": row[8]
            }
            for row in rows
        ]
        return jsonify(requests), 200
    except Exception as e:
        print(f"Error fetching event requests: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/api/push-event-request', methods=['POST'])
def api_push_event_request():
    data = request.json
    req_id = data.get('id')
    if not req_id:
        return jsonify({"error": "Missing event request ID"}), 400
    try:
        # Get the event request
        conn = sqlite3.connect(EVENT_REQUESTS_DB_PATH)
        cursor = conn.cursor()
        cursor.execute('SELECT name, email, date, start_time, end_time, location, people, volunteer_hours FROM event_requests WHERE id = ?', (req_id,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            return jsonify({"error": "Event request not found"}), 404

        # Insert into main events table
        conn2 = sqlite3.connect(EVENTS_DB_PATH)
        cursor2 = conn2.cursor()
        cursor2.execute('''
            INSERT INTO events (name, date, location, start_time, end_time, people, volunteer_hours)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (row[0], row[2], row[5], row[3], row[4], row[6], row[7]))
        conn2.commit()
        conn2.close()

        # Remove from event_requests
        cursor.execute('DELETE FROM event_requests WHERE id = ?', (req_id,))
        conn.commit()
        conn.close()
        return jsonify({"message": "Event pushed successfully"}), 200
    except Exception as e:
        print(f"Error pushing event request: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/api/deny-event-request', methods=['POST'])
def api_deny_event_request():
    data = request.json
    req_id = data.get('id')
    if not req_id:
        return jsonify({"error": "Missing event request ID"}), 400
    try:
        conn = sqlite3.connect(EVENT_REQUESTS_DB_PATH)
        cursor = conn.cursor()
        cursor.execute('DELETE FROM event_requests WHERE id = ?', (req_id,))
        conn.commit()
        conn.close()
        return jsonify({"message": "Event request denied"}), 200
    except Exception as e:
        print(f"Error denying event request: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/api/announcements', methods=['GET'])
def get_announcements():
    conn = sqlite3.connect(ANNOUNCEMENTS_DB_PATH)
    c = conn.cursor()
    c.execute('SELECT id, title, content, author, created_at FROM announcements ORDER BY created_at DESC')
    announcements = [
        {
            "id": row[0],
            "title": row[1],
            "content": row[2],
            "author": row[3],
            "created_at": to_est(row[4]) if row[4] else None
        }
        for row in c.fetchall()
    ]
    conn.close()
    return jsonify(announcements), 200

@app.route('/api/announcements/<int:announcement_id>/comments', methods=['GET'])
def get_comments(announcement_id):
    conn = sqlite3.connect(ANNOUNCEMENTS_DB_PATH)
    c = conn.cursor()
    c.execute('SELECT commenter, comment, created_at FROM comments WHERE announcement_id = ? ORDER BY created_at ASC', (announcement_id,))
    comments = [
        {
            "commenter": row[0],
            "comment": row[1],
            "created_at": to_est(row[2]) if row[2] else None
        }
        for row in c.fetchall()
    ]
    conn.close()
    return jsonify(comments), 200

@app.route('/api/announcements/<int:announcement_id>/comments', methods=['POST'])
def post_comment(announcement_id):
    data = request.json
    commenter = data.get('commenter')
    comment = data.get('comment')
    if not commenter or not comment:
        return jsonify({"error": "Missing commenter or comment"}), 400
    conn = sqlite3.connect(ANNOUNCEMENTS_DB_PATH)
    c = conn.cursor()
    c.execute('INSERT INTO comments (announcement_id, commenter, comment) VALUES (?, ?, ?)', (announcement_id, commenter, comment))
    conn.commit()
    conn.close()
    return jsonify({"success": True}), 200

# (Admins can POST to /api/announcements to create new announcements on a different page)
@app.route('/api/announcements', methods=['POST'])
def create_announcement():
    data = request.json
    title = data.get('title')
    content = data.get('content')
    author = data.get('author')
    if not title or not content or not author:
        return jsonify({"error": "Missing fields"}), 400
    conn = sqlite3.connect(ANNOUNCEMENTS_DB_PATH)
    c = conn.cursor()
    c.execute('INSERT INTO announcements (title, content, author) VALUES (?, ?, ?)', (title, content, author))
    conn.commit()
    conn.close()
    return jsonify({"success": True}), 200

@app.route('/api/announcements/<int:announcement_id>', methods=['DELETE'])
def delete_announcement(announcement_id):
    conn = sqlite3.connect(ANNOUNCEMENTS_DB_PATH)
    c = conn.cursor()
    c.execute('DELETE FROM announcements WHERE id = ?', (announcement_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True}), 200

@app.route('/api/announcements/<int:announcement_id>/comments', methods=['DELETE'])
def delete_comment(announcement_id):
    data = request.get_json()
    created_at = data.get('created_at')
    if not created_at:
        return jsonify({"error": "Missing created_at"}), 400
    conn = sqlite3.connect(ANNOUNCEMENTS_DB_PATH)
    c = conn.cursor()
    c.execute('DELETE FROM comments WHERE announcement_id = ? AND created_at = ?', (announcement_id, created_at))
    conn.commit()
    conn.close()
    return jsonify({"success": True}), 200

def to_est(dt_str):
    # dt_str is in format 'YYYY-MM-DD HH:MM:SS' (SQLite default)
    utc = pytz.utc
    est = pytz.timezone('US/Eastern')
    dt = datetime.strptime(dt_str, "%Y-%m-%d %H:%M:%S")
    dt_utc = utc.localize(dt)
    dt_est = dt_utc.astimezone(est)
    return dt_est.strftime("%Y-%m-%d %I:%M:%S %p EST")

if __name__ == '__main__':
    app.run(debug=True, port=5500)