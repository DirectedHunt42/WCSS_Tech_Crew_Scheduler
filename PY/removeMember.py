from flask import Flask, request, redirect, send_from_directory, jsonify
import os

app = Flask(__name__)

# Define the path to the memberList.txt file
MEMBER_LIST_PATH = os.path.join(os.path.dirname(__file__), '../Resources/memberList.txt')

# Serve static files (HTML, CSS, JS, etc.)
@app.route('/<path:filename>')
def serve_static_files(filename):
    return send_from_directory(os.path.join(os.path.dirname(__file__), '../'), filename)

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

if __name__ == '__main__':
    app.run(debug=True, port=5500)