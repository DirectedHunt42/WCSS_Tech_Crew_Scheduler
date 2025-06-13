import sqlite3
import json
import os
from datetime import datetime

# Set up paths to database and JSON resource files
BASE_DIR = os.path.dirname(__file__)
EVENTS_DB = os.path.join(BASE_DIR, '../Resources/events.db')
EVENT_REQUESTS_DB = os.path.join(BASE_DIR, '../Resources/eventRequests.db')
ANNOUNCEMENTS_DB = os.path.join(BASE_DIR, '../Resources/announcements.db')
OPTIN_JSON = os.path.join(BASE_DIR, '../Resources/optInRequests.json')

def get_timestamp():
    """Return the current timestamp as a formatted string."""
    from datetime import datetime
    return datetime.now().strftime("%Y / %m / %d - %H : %M : %S")

def get_school_year_cutoff():
    """
    Return a datetime object representing the start of the current school year.
    If before August, cutoff is August 1 of previous year.
    """
    now = datetime.now()
    year = now.year
    if now.month < 8:
        year -= 1
    return datetime(year, 8, 1)

CUTOFF = get_school_year_cutoff()  # Global cutoff date for old records

def parse_event_date(date_str):
    """
    Parse a date string in 'YYYY-MM-DD' or 'YYYY,MM,DD' format to a datetime object.
    Returns None if parsing fails.
    """
    try:
        if '-' in date_str:
            return datetime.strptime(date_str, "%Y-%m-%d")
        elif ',' in date_str:
            parts = [int(x) for x in date_str.split(',')]
            return datetime(parts[0], parts[1], parts[2])
    except Exception:
        return None

def clean_events_db(db_path, table_name):
    """
    Remove events from the specified table in the given database if their date is before the cutoff.
    """
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    try:
        # Check if the table exists
        c.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table_name}'")
        if not c.fetchone():
            print(f"Table '{table_name}' does not exist in {db_path}. Skipping.")
            return
        # Fetch all event ids and dates
        c.execute(f"SELECT id, date FROM {table_name}")
        to_delete = []
        for row in c.fetchall():
            event_id, date_str = row
            dt = parse_event_date(date_str)
            if dt and dt < CUTOFF:
                print(f"Will delete {table_name} id={event_id} date={date_str} (parsed: {dt})")
                to_delete.append(event_id)
        # Delete old events
        for eid in to_delete:
            c.execute(f"DELETE FROM {table_name} WHERE id = ?", (eid,))
            print(f"Deleted {table_name} id={eid}")
        conn.commit()
        print(f"Deleted {len(to_delete)} old records from {db_path} ({table_name})")
    finally:
        conn.close()

def clean_announcements_db():
    """
    Remove old announcements and their comments from the announcements database.
    Also remove comments not attached to any announcement.
    """
    conn = sqlite3.connect(ANNOUNCEMENTS_DB)
    c = conn.cursor()
    try:
        # Remove old announcements
        c.execute("SELECT id, created_at FROM announcements")
        to_delete = []
        for row in c.fetchall():
            ann_id, created_at = row
            try:
                dt = datetime.strptime(created_at, "%Y-%m-%d %H:%M:%S")
                if dt < CUTOFF:
                    to_delete.append(ann_id)
            except Exception:
                continue
        # Delete old announcements and their comments
        for aid in to_delete:
            c.execute("DELETE FROM announcements WHERE id = ?", (aid,))
            c.execute("DELETE FROM comments WHERE announcement_id = ?", (aid,))
        # Remove orphaned comments
        c.execute("DELETE FROM comments WHERE announcement_id NOT IN (SELECT id FROM announcements)")
        conn.commit()
        print(f"Deleted {len(to_delete)} old announcements and their comments")
    finally:
        conn.close()

def get_all_event_names():
    """
    Return a set of all valid event names from the events table.
    """
    event_names = set()
    # Check events table in events.db
    for db_path, table_name in [
        (EVENTS_DB, "events"),
    ]:
        if not os.path.exists(db_path):
            continue
        conn = sqlite3.connect(db_path)
        c = conn.cursor()
        try:
            c.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table_name}'")
            if not c.fetchone():
                continue
            try:
                c.execute(f"SELECT name FROM {table_name}")
                event_names.update(row[0] for row in c.fetchall())
            except Exception:
                continue
        finally:
            conn.close()
    return event_names

def clean_optin_json():
    """
    Remove opt-in requests for deleted or old events from the optInRequests.json file.
    """
    if not os.path.exists(OPTIN_JSON):
        return
    with open(OPTIN_JSON, "r") as f:
        data = json.load(f)
    changed = False

    # Get all valid event names
    valid_event_names = get_all_event_names()

    for user, events in list(data.items()):
        new_events = []
        for event in events:
            event_name = event.get("name")
            # Remove if event name is missing, empty, or not valid (event deleted)
            if not event_name or event_name not in valid_event_names:
                print(f"Removing orphaned or deleted opt-in (user: {user}, event: {event_name})")
                changed = True
                continue
            # Remove if event is old
            date_str = event.get("date") or event.get("eventDate")
            if date_str:
                dt = parse_event_date(date_str)
                if dt and dt < CUTOFF:
                    print(f"Removing opt-in for old event '{event_name}' (user: {user})")
                    changed = True
                    continue
            new_events.append(event)
        if len(new_events) != len(events):
            data[user] = new_events
            changed = True
    # Write changes back to file if any modifications were made
    if changed:
        with open(OPTIN_JSON, "w") as f:
            json.dump(data, f, indent=2)
        print("Cleaned old or deleted opt-in requests from optInRequests.json")

if __name__ == "__main__":
    # Main housekeeping script entry point
    print("\n\n\n---------- Housekeeping Script Started: " + get_timestamp() + " ----------")
    print(f"Cutoff date for this school year: {CUTOFF}")
    clean_events_db(EVENTS_DB, "events")
    clean_events_db(EVENT_REQUESTS_DB, "event_requests")
    clean_announcements_db()
    clean_optin_json()
    print("Housekeeping complete.")