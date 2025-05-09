from flask import Flask, request, jsonify, redirect, send_from_directory, make_response
import os

app = Flask(__name__)

# Define the path to the .txt files
EVENT_LIST_PATH = os.path.join(os.path.dirname(__file__), '../Resources/eventList.txt')
USER_LOGIN_PATH = os.path.join(os.path.dirname(__file__), '../Resources/logInList.txt')
ADMIN_LOGIN_PATH = os.path.join(os.path.dirname(__file__), '../Resources/adminLogInList.txt')
MEMBER_LIST_PATH = os.path.join(os.path.dirname(__file__), '../Resources/memberList.txt')

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
    user_type = data.get('type')  # 'user' or 'admin'

    if not username or not password or not user_type:
        return jsonify({"error": "Missing username, password, or user type"}), 400

    # Select the appropriate file based on user type
    login_path = USER_LOGIN_PATH if user_type == 'user' else ADMIN_LOGIN_PATH

    try:
        # Read the login file and validate credentials
        with open(login_path, 'r') as file:
            for line in file:
                try:
                    stored_username, stored_password = line.strip().split(':')
                except ValueError:
                    continue  # Skip malformed lines
                if username == stored_username and password == stored_password:
                    # Set a cookie for successful login
                    response = make_response(jsonify({"success": True, "message": "Login successful"}))
                    cookie_name = 'loggedInUser' if user_type == 'user' else 'loggedInAdmin'
                    response.set_cookie(cookie_name, username, max_age=3600, path='/')
                    return response

        return jsonify({"error": "Invalid username or password"}), 401
    except Exception as e:
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
    try:
        # Get the member name from the request
        member_to_remove = request.json.get('member', '').strip()  # Trim whitespace

        print(f"Received request to remove member: '{member_to_remove}'")

        if not member_to_remove:
            return jsonify({"error": "Member name is required"}), 400

        # Read the current members from the file
        with open(MEMBER_LIST_PATH, 'r') as file:
            members = file.readlines()

        # Filter out the member to be removed (strip each line for comparison)
        updated_members = [member for member in members if member.strip() != member_to_remove]

        # Write the updated list back to the file
        with open(MEMBER_LIST_PATH, 'w') as file:
            file.writelines(updated_members)

        print(f"Member '{member_to_remove}' removed successfully!")
        return jsonify({"success": True, "message": f"Member '{member_to_remove}' removed successfully!"}), 200
    except Exception as e:
        print(f"Error removing member: {e}")
        return jsonify({"error": "Internal Server Error"}), 500

@app.route('/add-member', methods=['POST'])
def add_member():
    # Get the username and job from the request
    username = request.json.get('username')
    job = request.json.get('job')

    if not username or not job:
        return "Bad Request: Username and job are required", 400

    try:
        # Format the new member as "username, job"
        new_member = f"{username}, {job}\n"

        # Append the new member to the file
        with open(MEMBER_LIST_PATH, 'a') as file:
            file.write(new_member)

        print(f"Member '{new_member.strip()}' added successfully!")
        return jsonify({"success": True, "message": "Member added successfully!"}), 200
    except Exception as e:
        print(f"Error adding member: {e}")
        return "Internal Server Error", 500

if __name__ == '__main__':
    app.run(debug=True, port=5500)