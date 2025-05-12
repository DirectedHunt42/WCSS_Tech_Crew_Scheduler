from flask import Flask, request, jsonify, redirect, send_from_directory, make_response
from flask_cors import CORS
import os
import bcrypt
import sqlite3

app = Flask(__name__)
CORS(app, supports_credentials=True)

# Define the path to the .txt files
EVENT_LIST_PATH = os.path.join(os.path.dirname(__file__), '../Resources/eventList.txt')
USER_LOGIN_PATH = os.path.join(os.path.dirname(__file__), '../Resources/logInList.db')
ADMIN_LOGIN_PATH = os.path.join(os.path.dirname(__file__), '../Resources/adminLogInList.db')
MEMBER_LIST_PATH = os.path.join(os.path.dirname(__file__), '../Resources/memberList.txt')
EVENT_LIST_FILE = os.path.join(os.path.dirname(__file__), '../Resources/eventList.txt')

# Serve static files (HTML, CSS, JS, etc.)
@app.route('/<path:filename>')
def serve_static_files(filename):
    return send_from_directory(os.path.join(os.path.dirname(__file__), '../'), filename)

@app.route('/save-event', methods=['POST'])
def save_event():
    # Get form data
    date = request.form.get('date').replace('-', ',')
    event_name = request.form.get('EventName')
    location = request.form.get('Location')
    start_time = request.form.get('Stime')
    end_time = request.form.get('Etime')
    people = request.form.get('people')
    volunteer_hours = request.form.get('VolHours')

    # Format the data as a CSV line
    event_data = f"\n{date}, {event_name}, {location}, {start_time}, {end_time}, {people}, {volunteer_hours}"

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
        cursor.execute('SELECT password FROM users WHERE username = ?', (username,))
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
    # Get the username of the member to remove
    member_to_remove = request.json.get('member', '').strip()

    if not member_to_remove:
        return jsonify({"error": "Member name is required"}), 400

    try:
        # Remove the member from the MEMBER_LIST_PATH file
        with open(MEMBER_LIST_PATH, 'r') as file:
            members = file.readlines()

        # Filter out the member to remove
        updated_members = [member for member in members if not member.startswith(f"{member_to_remove},")]
        if len(members) == len(updated_members):
            return jsonify({"error": f"Member '{member_to_remove}' not found in the member list"}), 404

        # Write the updated member list back to the file
        with open(MEMBER_LIST_PATH, 'w') as file:
            file.writelines(updated_members)
        print(f"Member '{member_to_remove}' removed from the member list successfully!")

        # Remove the member from the USER_LOGIN_PATH database
        conn = sqlite3.connect(USER_LOGIN_PATH)
        cursor = conn.cursor()

        # Delete the member from the database
        cursor.execute('DELETE FROM users WHERE username = ?', (member_to_remove,))
        conn.commit()

        # Check if a row was deleted
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({"error": f"Member '{member_to_remove}' not found in the login database"}), 404

        conn.close()

        print(f"Member '{member_to_remove}' removed from the login database successfully!")
        return jsonify({"success": True, "message": f"Member '{member_to_remove}' removed successfully!"}), 200
    except FileNotFoundError:
        return jsonify({"error": "Member list file not found"}), 500
    except sqlite3.Error as e:
        print(f"Database error: {e}")
        return jsonify({"error": "Database error"}), 500
    except Exception as e:
        print(f"Error removing member: {e}")
        return jsonify({"error": "Internal Server Error"}), 500

@app.route('/add-member', methods=['POST'])
def add_member():
    # Get the username, job, and password from the request
    username = request.json.get('username')
    job = request.json.get('job')
    password = request.json.get('password')

    if not username or not job or not password:
        return jsonify({"error": "Username, job, and password are required"}), 400

    try:
        # Hash the password
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

        # Add the member to the MEMBER_LIST_PATH file
        new_member = f"{username}, {job}\n"
        with open(MEMBER_LIST_PATH, 'a') as file:
            file.write(new_member)
        print(f"Member '{username}' added to the member list successfully!")

        # Add the member to the USER_LOGIN_PATH database
        conn = sqlite3.connect(USER_LOGIN_PATH)
        cursor = conn.cursor()

        # Create the users table if it doesn't exist
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
        ''')

        # Insert the new member into the database
        cursor.execute('INSERT INTO users (username, password) VALUES (?, ?)', (username, hashed_password))
        conn.commit()
        conn.close()

        print(f"Member '{username}' added to the login database successfully!")
        return jsonify({"success": True, "message": "Member added successfully!"}), 200
    except sqlite3.IntegrityError:
        return jsonify({"error": "Username already exists"}), 400
    except Exception as e:
        print(f"Error adding member: {e}")
        return jsonify({"error": "Internal Server Error"}), 500
    
@app.route('/api/getEvent', methods=['GET'])
def get_event():
    event_id = request.args.get('id')
    if not event_id:
        return "Event ID is required", 400

    try:
        with open(EVENT_LIST_FILE, 'r') as file:
            lines = file.readlines()
            line_index = int(event_id) - 1
            if line_index < 0 or line_index >= len(lines):
                return "Event not found", 404

            line = lines[line_index].strip().split(', ')
            event = {
                "id": event_id,
                "date": line[0],
                "name": line[1],
                "startTime": line[2],
                "endTime": line[3],
                "location": line[4],
                "TCP": line[5],
                "voulenteerHours": line[6],
            }
            return jsonify(event)
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

        line_index = int(updated_event['id']) - 1
        if line_index < 0 or line_index >= len(lines):
            return "Event not found", 404

        lines[line_index] = f"{updated_event['date'].replace('-', ',')}, {updated_event['name']}, {updated_event['startTime']}, {updated_event['endTime']}, {updated_event['location']}, {updated_event['TCP']}, {updated_event['voulenteerHours']}, {updated_event['id']}\n"

        with open(EVENT_LIST_FILE, 'w') as file:
            file.writelines(lines)

        return "Event updated successfully", 200
    except Exception as e:
        return f"Error updating event list: {str(e)}", 500

@app.errorhandler(404)
def page_not_found(e):
    # Serve a custom 404 HTML page
    return send_from_directory(os.path.join(os.path.dirname(__file__), '../'), '404.html'), 404

if __name__ == '__main__':
    app.run(debug=True, port=5500)