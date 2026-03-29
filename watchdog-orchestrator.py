import time
import os
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# Import your existing AI Judge function
from judge import triage_silent

# Dynamic pathing
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FOLDER_TO_WATCH = os.path.join(BASE_DIR, "pending_cases_json")
QUEUE_FILE = os.path.join(BASE_DIR, "master_queue.txt")

# --- 1. THE BACKLOG CRUSHER (Process existing unjudged files) ---
def process_backlog():
    print("\n--- Scanning for unjudged cases in backlog ---")
    
    # 1a. Figure out what we have already judged
    judged_cases = set()
    if os.path.exists(QUEUE_FILE):
        with open(QUEUE_FILE, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    filename = line.split(" | Verdict: ")[0].replace("Case: ", "").strip()
                    judged_cases.add(filename)
                except:
                    pass
    
    # 1b. Find all json files in all subfolders (US and Indian)
    unjudged_files = []
    for root, dirs, files in os.walk(FOLDER_TO_WATCH):
        for file in files:
            if file.endswith('.json') and file not in judged_cases:
                unjudged_files.append(os.path.join(root, file))
    
    if not unjudged_files:
        print("Backlog is clear! All existing cases have been judged.")
        return

    print(f"Found {len(unjudged_files)} cases needing AI judgment. Starting batch process...")
    
    # 1c. Send them to the AI Judge
    for filepath in unjudged_files:
        print(f"[BACKLOG] Handoff to AI Judge: {os.path.basename(filepath)}")
        try:
            triage_silent(filepath)
            
            # CRITICAL: We sleep for 3 seconds between cases. 
            # If we slam the Groq API with 2,200 requests instantly, they will block your IP for Rate Limiting.
            time.sleep(3) 
        except Exception as e:
            print(f"Error processing {filepath}: {e}")
            
    print("--- Backlog processing complete! ---\n")

# --- 2. THE LIVE WATCHDOG (Monitor for future drops) ---
class CaseHandler(FileSystemEventHandler):
    def on_created(self, event):
        if not event.is_directory and event.src_path.endswith('.json'):
            print(f"\n[WATCHDOG] New case detected: {os.path.basename(event.src_path)}")
            time.sleep(1)
            print("[WATCHDOG] Handing off to AI Judge...")
            try:
                triage_silent(event.src_path)
                print("[WATCHDOG] Case processed and saved to master queue.\n")
            except Exception as e:
                print(f"[WATCHDOG] Error processing case: {e}")

if __name__ == "__main__":
    print("==================================================")
    print(" SYSTEM ACTIVE: Smart Orchestrator Online")
    print(f" Monitoring: {FOLDER_TO_WATCH}")
    print("==================================================\n")
    
    # First, process anything sitting in the folders
    process_backlog()
    
    # Then, start watching for brand new files
    event_handler = CaseHandler()
    observer = Observer()
    
    # FIXED: recursive=True allows it to watch the US and Indian subfolders
    observer.schedule(event_handler, FOLDER_TO_WATCH, recursive=True)
    observer.start()
    
    print("[WATCHDOG] Standing by for new case drops...")
    try:
        while True:
            time.sleep(3)
    except KeyboardInterrupt:
        observer.stop()
        print("\n[WATCHDOG] Shutting down...")
    observer.join()