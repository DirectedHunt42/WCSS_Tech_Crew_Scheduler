from flask import Flask, request, redirect, send_from_directory, jsonify
import os

app = Flask(__name__)

# Define the path to the memberList.txt file
MEMBER_LIST_PATH = os.path.join(os.path.dirname(__file__), '../Resources/memberList.txt')

# Serve static files (HTML, CSS, JS, etc.)
@app.route('/<path:filename>')
def serve_static_files(filename):
    return send_from_directory(os.path.join(os.path.dirname(__file__), '../'), filename)

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