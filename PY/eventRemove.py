from flask import Flask, request, jsonify,  send_from_directory
import os

app = Flask(__name__)

# Path to the event list file
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

if __name__ == '__main__':
    app.run(debug=True)