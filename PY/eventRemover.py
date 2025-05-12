from flask import Flask, request, jsonify, redirect, send_from_directory
import os

app = Flask(__name__)

EVENT_LIST_PATH = os.path.join(os.path.dirname(__file__), '../Resources/eventList.txt')

# Serve static files (HTML, CSS, JS, etc.)
@app.route('/<path:filename>')
def serve_static_files(filename):
    return send_from_directory(os.path.join(os.path.dirname(__file__), '../'), filename)

@app.route('/remove_event', methods=['POST'])
def remove_event():
    try:
        # Get the event ID from the request
        data = request.get_json()
        event_id = str(data.get('id')).strip()  # Ensure the ID is a string and stripped of whitespace

        # Debugging: Log the received event ID
        print(f"Received event ID to remove: {event_id}")

        if not event_id:
            return jsonify({'error': 'Event ID is required'}), 400

        # Debugging: Log the file path
        print(f"Event list file path: {EVENT_LIST_PATH}")

        # Read the current events from the file
        with open(EVENT_LIST_PATH, 'r') as file:
            events = file.readlines()

        # Debugging: Log the original events
        print(f"Original events: {events}")

        # Filter out the event with the matching ID
        updated_events = [
            event for event in events
            if event.strip().split(',')[-1].strip() != event_id
        ]

        # Debugging: Log the updated events
        print(f"Updated events: {updated_events}")

        # Write the updated events back to the file
        with open(EVENT_LIST_PATH, 'w') as file:
            file.writelines(updated_events)

        # Debugging: Confirm file write
        print("Updated events written to file.")

        return jsonify({'message': 'Event removed successfully'}), 200
    except Exception as e:
        # Debugging: Log the error
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)