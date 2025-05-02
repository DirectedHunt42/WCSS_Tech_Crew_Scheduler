from flask import Flask, request, render_template_string
import os

app = Flask(__name__)

# Ensure the directory for the file exists
resources_dir = os.path.join(os.path.dirname(__file__), "../Resources")
os.makedirs(resources_dir, exist_ok=True)

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

    # Format the data
    event_data = f"\n{date},{event_name},{location},{start_time},{end_time},{people},{volunteer_hours}"

    # Save to eventList.txt
    event_list_path = os.path.join(resources_dir, "eventList.txt")
    with open(event_list_path, "a") as file:
        file.write(event_data)

    # Return a success message
    return '''
        <h1>Event Saved Successfully!</h1>
        <a href="/AdminPage/AdminEventBooking.html">Back to Form</a>
    '''

if __name__ == '__main__':
    app.run(debug=True)