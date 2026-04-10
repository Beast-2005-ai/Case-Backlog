import time
import os
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from datetime import datetime

# Import your existing AI Judge function
from judge import triage_silent

# Dynamic pathing
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FOLDER_TO_WATCH = os.path.join(BASE_DIR, "pending_cases_json")
QUEUE_FILE = os.path.join(BASE_DIR, "master_queue.txt")
LOG_FILE = os.path.join(BASE_DIR, "system_logs.txt")

def write_log(action, details=""):
    """Writes to terminal and streams to React UI Logs"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_entry = f"[{timestamp}] {action} | {details}\n"
    print(log_entry.strip())
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(log_entry)

# --- 1. THE BACKLOG CRUSHER (Process existing unjudged files) ---
def process_backlog():
    write_log("BACKLOG SCAN", "Scanning for unjudged cases in backlog...")
    
    judged_cases = set()
    if os.path.exists(QUEUE_FILE):
        with open(QUEUE_FILE, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    filename = line.split(" | Verdict: ")[0].replace("Case: ", "").strip()
                    judged_cases.add(filename)
                except:
                    pass
    
    unjudged_files = []
    for root, dirs, files in os.walk(FOLDER_TO_WATCH):
        for file in files:
            if file.endswith('.json') and file not in judged_cases:
                unjudged_files.append(os.path.join(root, file))
    
    if not unjudged_files:
        write_log("BACKLOG CLEAR", "All existing cases have been judged.")
        return

    write_log("BATCH PROCESS", f"Found {len(unjudged_files)} cases needing AI judgment.")
    
    for filepath in unjudged_files:
        write_log("JUDGE HANDOFF", f"Processing {os.path.basename(filepath)}")
        try:
            triage_silent(filepath)
            time.sleep(3) 
        except Exception as e:
            write_log("ERROR", f"Failed to process {os.path.basename(filepath)}: {e}")
            
    write_log("BATCH COMPLETE", "Backlog processing complete!")

# --- 2. THE LIVE WATCHDOG (Monitor for future drops) ---
class CaseHandler(FileSystemEventHandler):
    def on_created(self, event):
        if not event.is_directory and event.src_path.endswith('.json'):
            write_log("NEW CASE", f"Detected drop: {os.path.basename(event.src_path)}")
            time.sleep(1)
            try:
                triage_silent(event.src_path)
                write_log("SUCCESS", f"Case {os.path.basename(event.src_path)} processed and saved.")
            except Exception as e:
                write_log("ERROR", f"Failed processing new case: {e}")

if __name__ == "__main__":
    write_log("SYSTEM STARTUP", f"Smart Orchestrator Online. Monitoring: {FOLDER_TO_WATCH}")
    
    process_backlog()
    
    event_handler = CaseHandler()
    observer = Observer()
    
    observer.schedule(event_handler, FOLDER_TO_WATCH, recursive=True)
    observer.start()
    
    write_log("STANDBY", "Watchdog standing by for new case drops...")
    try:
        while True:
            time.sleep(3)
    except KeyboardInterrupt:
        observer.stop()
        write_log("SYSTEM SHUTDOWN", "Watchdog offline.")
    observer.join()