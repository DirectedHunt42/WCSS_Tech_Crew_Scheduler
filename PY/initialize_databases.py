import sqlite3
import bcrypt
import os

# Define the paths to the databases
BASE_DIR = os.path.dirname(__file__)
USER_LOGIN_PATH = os.path.join(BASE_DIR, '../Resources/logInList.db')
ADMIN_LOGIN_PATH = os.path.join(BASE_DIR, '../Resources/adminLogInList.db')

def initialize_database(db_path, username, password):
    try:
        # Connect to the database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Create the users table if it doesn't exist
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
        ''')

        # Hash the password
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

        # Insert the user into the database
        cursor.execute('INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)', (username, hashed_password))
        conn.commit()
        conn.close()

        print(f"Database '{db_path}' initialized successfully with user '{username}'.")
    except Exception as e:
        print(f"Error initializing database '{db_path}': {e}")

if __name__ == "__main__":
    # Initialize the user login database
    initialize_database(USER_LOGIN_PATH, "Jhon", "Doe")

    # Initialize the admin login database
    initialize_database(ADMIN_LOGIN_PATH, "Jhon", "Doe")