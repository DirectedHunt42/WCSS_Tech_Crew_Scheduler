from flask import Flask, request, jsonify, redirect, send_from_directory, make_response
from flask_cors import CORS
import os
import bcrypt
import sqlite3
import requests
import json
import time

app = Flask(__name__)
CORS(app, supports_credentials=True)

# Define the path to the .txt files
EVENT_LIST_PATH = os.path.join(os.path.dirname(__file__), '../Resources/eventList.txt')
USER_LOGIN_PATH = os.path.join(os.path.dirname(__file__), '../Resources/logInList.db')
ADMIN_LOGIN_PATH = os.path.join(os.path.dirname(__file__), '../Resources/adminLoginList.db')
EVENT_LIST_FILE = os.path.join(os.path.dirname(__file__), '../Resources/eventList.txt')
OPT_IN_REQUESTS_FILE = os.path.join(os.path.dirname(__file__), '../Resources/optInRequests.json')

# Serve static files (HTML, CSS, JS, etc.)
@app.route('/<path:filename>')
def serve_static_files(filename):
    return send_from_directory(os.path.join(os.path.dirname(__file__), '../'), filename)

@app.route('/save-event', methods=['POST'])
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

    # --- Add this validation ---
    if start_time and end_time:
        try:
            start_hour, start_minute = map(int, start_time.split(':'))
            end_hour, end_minute = map(int, end_time.split(':'))
            start = start_hour * 60 + start_minute
            end = end_hour * 60 + end_minute
            if end <= start:
                # Return a 400 error and a message
                return "End time must be after start time", 400
        except Exception as e:
            return "Invalid time format", 400
    # --- End validation ---
    else:

        # Determine the next event ID
        try:
            with open(EVENT_LIST_PATH, 'r') as file:
                lines = file.readlines()
                if lines:
                    last_line = lines[-1].strip()
                    last_id_str = last_line.split(',')[-1].strip()
                    try:
                        last_id = int(last_id_str)
                    except ValueError:
                        last_id = 0
                else:
                    last_id = 0
            next_id = last_id + 1
        except Exception as e:
            print(f"Error reading event list for ID: {e}")
            next_id = 1

        # Format the data as a CSV line with the new ID
        event_data = f"\n{date}, {event_name}, {location}, {start_time}, {end_time}, {people}, {volunteer_hours}, {next_id}"

        # Write the data to eventList.txt
        try:
            with open(EVENT_LIST_PATH, 'a') as file:
                file.write(event_data)
            print("Event saved successfully!")
        except Exception as e:
            print(f"Error saving event: {e}")
            return "Internal Server Error", 500

        # Redirect back to the form page
        return redirect('/AdminPage/AdminPage.html')

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
        with open(EVENT_LIST_FILE, 'r') as file:
            lines = file.readlines()
            for line in lines:
                parts = [p.strip() for p in line.strip().split(',')]
                if parts and parts[-1] == event_id:
                    # Adjust indices as needed for your CSV format
                    event = {
                        "id": event_id,
                        "date": ','.join(parts[0:3]),  # year, month, day
                        "name": parts[3],
                        "startTime": parts[4],
                        "endTime": parts[5],
                        "location": parts[6],
                        "TCP": parts[7],
                        "voulenteerHours": parts[8],
                    }
                    return jsonify(event)
            return "Event not found", 404
    except Exception as e:
        return f"Error reading event list: {str(e)}", 500

@app.route('/api/updateEvent', methods=['POST'])
def update_event():
    updated_event = request.json
    if not updated_event or 'id' not in updated_event:
        return "Invalid event data", 400

    try:
        with open(EVENT_LIST_FILE, 'r') as file:
            lines = file.readlines()

        found = False
        for i, line in enumerate(lines):
            parts = [p.strip() for p in line.strip().split(',')]
            if parts and parts[-1] == str(updated_event['id']):
                # Compose the updated line (adjust indices as needed)
                lines[i] = f"{updated_event['date'].replace('-', ',')}, {updated_event['name']}, {updated_event['startTime']}, {updated_event['endTime']}, {updated_event['location']}, {updated_event['TCP']}, {updated_event['voulenteerHours']}, {updated_event['id']}\n"
                found = True
                break

        if not found:
            return "Event not found", 404

        with open(EVENT_LIST_FILE, 'w') as file:
            file.writelines(lines)

        return "Event updated successfully", 200
    except Exception as e:
        return f"Error updating event list: {str(e)}", 500

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
    try:
        # Get the event ID from the request
        data = request.get_json()
        event_id = str(data.get('id')).strip()  # Ensure the ID is a string and stripped of whitespace

        if not event_id:
            return jsonify({'error': 'Event ID is required'}), 400

        # Read the current events from the file
        with open(EVENT_LIST_PATH, 'r') as file:
            events = file.readlines()

        # Filter out the event with the matching ID
        updated_events = [
            event for event in events
            if event.strip().split(',')[-1].strip() != event_id
        ]

        # Check if any event was removed
        if len(events) == len(updated_events):
            return jsonify({'error': f'Event with ID {event_id} not found'}), 404

        # Write the updated events back to the file
        with open(EVENT_LIST_PATH, 'w') as file:
            file.writelines(updated_events)

        return jsonify({'message': 'Event removed successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

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

if __name__ == '__main__':
    app.run(debug=True, port=5500)