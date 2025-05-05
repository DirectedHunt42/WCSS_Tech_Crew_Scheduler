from flask import Flask, request
import os

app = Flask(__name__)

# Define the path to the memberList.txt file
MEMBER_LIST_PATH = os.path.join(os.path.dirname(__file__), '../Resources/memberList.txt')

@app.route('/remove-member', methods=['POST'])
def remove_member():
    # Get the member name from the request
    member_to_remove = request.json.get('member')

    if not member_to_remove:
        return "Bad Request: Member name is required", 400

    try:
        # Read the current members from the file
        with open(MEMBER_LIST_PATH, 'r') as file:
            members = file.readlines()

        # Filter out the member to be removed
        updated_members = [member for member in members if member.strip() != member_to_remove]

        # Write the updated list back to the file
        with open(MEMBER_LIST_PATH, 'w') as file:
            file.writelines(updated_members)

        print(f"Member '{member_to_remove}' removed successfully!")
        return {"success": True}, 200
    except Exception as e:
        print(f"Error removing member: {e}")
        return "Internal Server Error", 500

if __name__ == '__main__':
    app.run(debug=True, port=5500)