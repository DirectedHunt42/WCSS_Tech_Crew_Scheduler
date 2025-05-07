# filepath: c:\Users\jackp\School\Computer_Science\Computer_Science-Grade_11\Final\WCSS_Tech_Crew_Scheduler\server.py
from flask import Flask, request, jsonify
import os

app = Flask(__name__)

# Paths to the login files
USER_LOGIN_PATH = os.path.join(os.path.dirname(__file__), 'Resources/logInList.txt')
ADMIN_LOGIN_PATH = os.path.join(os.path.dirname(__file__), 'Resources/adminLogInList.txt')

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
                stored_username, stored_password = line.strip().split(':')
                if username == stored_username and password == stored_password:
                    return jsonify({"success": True, "message": "Login successful"}), 200

        return jsonify({"error": "Invalid username or password"}), 401
    except Exception as e:
        return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5500)