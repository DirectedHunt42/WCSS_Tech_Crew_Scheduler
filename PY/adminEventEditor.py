from flask import Flask, request, jsonify, redirect, send_from_directory
import os

app = Flask(__name__)

EVENT_LIST_FILE = os.path.join(os.path.dirname(__file__), '../Resources/eventList.txt')

# Serve static files (HTML, CSS, JS, etc.)
@app.route('/<path:filename>')
def serve_static_files(filename):
    return send_from_directory(os.path.join(os.path.dirname(__file__), '../'), filename)

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

        lines[line_index] = f"{updated_event['date'].replace('-', ',')}, {updated_event['name']}, {updated_event['startTime']}, {updated_event['endTime']}, {updated_event['location']}, {updated_event['details']}\n"

        with open(EVENT_LIST_FILE, 'w') as file:
            file.writelines(lines)

        return "Event updated successfully", 200
    except Exception as e:
        return f"Error updating event list: {str(e)}", 500

if __name__ == '__main__':
    app.run(debug=True, port=5500)