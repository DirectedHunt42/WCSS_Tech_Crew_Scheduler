import os
import shutil
import subprocess

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
RESOURCES_DIR = os.path.join(PROJECT_DIR, "Resources")
BACKUP_DIR = "/home/Admin/resources_backup"  # Change this path as needed

def backup_resources():
    if os.path.exists(BACKUP_DIR):
        shutil.rmtree(BACKUP_DIR)
    if os.path.exists(RESOURCES_DIR):
        shutil.copytree(RESOURCES_DIR, BACKUP_DIR)

def restore_resources():
    if os.path.exists(RESOURCES_DIR):
        shutil.rmtree(RESOURCES_DIR)
    if os.path.exists(BACKUP_DIR):
        shutil.copytree(BACKUP_DIR, RESOURCES_DIR)
        shutil.rmtree(BACKUP_DIR)

def git_force_pull():
    subprocess.run(["git", "fetch", "--all"], cwd=PROJECT_DIR)
    subprocess.run(["git", "reset", "--hard", "origin/main"], cwd=PROJECT_DIR)

if __name__ == "__main__":
    print("Backing up resources folder...")
    backup_resources()
    print("Force pulling latest code from main...")
    git_force_pull()
    print("Restoring resources folder...")
    restore_resources()
    print("Update complete!")