from flask import Flask, request, render_template_string
import os

app = Flask(__name__)

# Ensure the directory for the file exists
os.makedirs("Resources", exist_ok=True)

@app.route('/save-event', methods=['POST'])
def save_event():
    # Get form data
    date = request.form.get('date')
    event_name = request.form.get('EventName')
    location = request.form.get('Location')
    start_time = request.form.get('Stime')
    end_time = request.form.get('Etime')
    people = request.form.get('people')
    volunteer_hours = request.form.get('VolHours')

    # Format the data
    event_data = f"Date: {date}\nEvent Name: {event_name}\nLocation: {location}\nStart Time: {start_time}\nEnd Time: {end_time}\nPeople Needed: {people}\nVolunteer Hours: {volunteer_hours}\n\n"

    # Save to eventList.txt
    with open("Resources/eventList.txt", "a") as file:
        file.write(event_data)

    # Return a success message
    return '''
        <h1>Event Saved Successfully!</h1>
        <a href="AdminEventBooking.html">Back to Form</a>
    '''

if __name__ == '__main__':
    app.run(debug=True)