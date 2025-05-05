from flask import Flask, request, redirect, send_from_directory
import os

app = Flask(__name__)

# Define the path to the eventList.txt file
EVENT_LIST_PATH = os.path.join(os.path.dirname(__file__), '../Resources/eventList.txt')

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

if __name__ == '__main__':
    app.run(debug=True, port=5501)