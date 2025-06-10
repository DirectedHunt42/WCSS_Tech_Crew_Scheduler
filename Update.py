import os
import shutil
import subprocess

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
RESOURCES_DIR = os.path.join(PROJECT_DIR, "Resources")
BACKUP_DIR = "/home/Admin/resources_backup"  # Change this path as needed

def get_timestamp():
    from datetime import datetime
    return datetime.now().strftime("%Y%m%d_%H%M%S")

def backup_resources():
    print(f"Checking for existing backup at {BACKUP_DIR}...")
    if os.path.exists(BACKUP_DIR):
        print("Existing backup found. Removing...")
        shutil.rmtree(BACKUP_DIR)
    if os.path.exists(RESOURCES_DIR):
        print(f"Copying {RESOURCES_DIR} to {BACKUP_DIR}...")
        shutil.copytree(RESOURCES_DIR, BACKUP_DIR)
        print("Backup complete.")
    else:
        print(f"Resources folder {RESOURCES_DIR} does not exist. Skipping backup.")

def restore_resources():
    print(f"Restoring resources from {BACKUP_DIR} to {RESOURCES_DIR}...")
    if os.path.exists(RESOURCES_DIR):
        print(f"Removing current resources folder at {RESOURCES_DIR}...")
        shutil.rmtree(RESOURCES_DIR)
    if os.path.exists(BACKUP_DIR):
        shutil.copytree(BACKUP_DIR, RESOURCES_DIR)
        print("Restore complete. Removing backup folder...")
        shutil.rmtree(BACKUP_DIR)
    else:
        print(f"No backup found at {BACKUP_DIR}. Skipping restore.")

def git_force_pull():
    print("Fetching all branches from remote...")
    fetch = subprocess.run(["git", "fetch", "--all"], cwd=PROJECT_DIR, capture_output=True, text=True)
    print(fetch.stdout)
    if fetch.stderr:
        print("Fetch errors:", fetch.stderr)
    print("Resetting local branch to origin/main...")
    reset = subprocess.run(["git", "reset", "--hard", "origin/main"], cwd=PROJECT_DIR, capture_output=True, text=True)
    print(reset.stdout)
    if reset.stderr:
        print("Reset errors:", reset.stderr)
    print("Showing summary of changes (insertions/deletions)...")
    summary = subprocess.run(
        ["git", "diff", "--stat", "HEAD@{1}", "HEAD"],
        cwd=PROJECT_DIR, capture_output=True, text=True
    )
    print(summary.stdout)
    if summary.stderr:
        print("Summary errors:", summary.stderr)

if __name__ == "__main__":
    print("\n\n\n---------- Update Script Started: " + get_timestamp() + " ----------")
    print("Backing up resources folder...")
    backup_resources()
    print("Force pulling latest code from main...")
    git_force_pull()
    print("Restoring resources folder...")
    restore_resources()
    print("Update complete!")