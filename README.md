# Case Backlog System

## Overview

The Case Backlog System is an AI-powered application designed to manage and process legal case backlogs for US and Indian jurisdictions. It uses natural language processing (NLP) to classify and triage cases, builds a vector database for efficient search and retrieval, and provides a web dashboard for monitoring the case queue.

The system consists of:
- A React-based frontend dashboard for visualizing the case queue
- A FastAPI backend server to serve case data
- AI judgment scripts for automatic case classification
- A watchdog orchestrator that monitors for new cases and triggers processing
- Data processing pipelines for fetching, cleaning, and vectorizing case data

## Prerequisites

- Python 3.8 or higher
- Node.js 16 or higher
- Git

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd "Case Backlog System"
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Install frontend dependencies:
   ```bash
   cd dashboard
   npm install
   cd ..
   ```

## Running the Application

### 1. Start the Frontend Dashboard

The frontend is built with React and Vite. To start the development server:

```bash
cd dashboard
npm run dev
```

This will start the dashboard on `http://localhost:5173` (default Vite port).

### 2. Start the API Bridge (FastAPI Server)

The API bridge serves the case queue data to the frontend. Run it in a separate terminal:

```bash
python api_bridge.py
```

The FastAPI server will start on `http://localhost:8000` (default FastAPI port).

### 3. (Optional) Run the Watchdog Orchestrator

The watchdog-orchestrator script monitors the `pending_cases_json` folder for new case files. When new JSON files are added (for US or Indian cases), it automatically processes them through the AI judgment system and updates the master queue.

To start the orchestrator:

```bash
python watchdog-orchestrator.py
```

**What does the watchdog-orchestrator do?**
- Monitors the `pending_cases_json/US` and `pending_cases_json/Indian` folders for new `.json` case files
- Processes any backlog of unjudged cases on startup
- Automatically calls the AI judge (`judge.py`) to classify new cases
- Updates `master_queue.txt` with verdicts
- Includes rate limiting (3-second delays) to avoid API throttling
- Runs continuously, watching for file system changes

## How the Project Works

1. **Data Ingestion**: Case data is fetched from external sources using scripts like `refetch_us_data.py` and `refetch_indian_data.py`. Cases are stored as JSON files in `pending_cases_json/US` and `pending_cases_json/Indian`.

2. **AI Processing**:
   - `nlp-cleaner.py`: Cleans and preprocesses legal text
   - `judge.py`: Uses AI (likely Groq API) to classify cases and provide verdicts
   - `vectordb-builder.py`: Builds a ChromaDB vector database for semantic search

3. **Orchestration**: The watchdog-orchestrator ensures new cases are automatically processed as they arrive.

4. **API Layer**: `api_bridge.py` provides REST endpoints to access the processed case queue.

5. **Frontend**: The React dashboard displays the case queue, allowing users to view AI verdicts and manage cases.

6. **Bulk Operations**: `bulk_loader.py` handles batch processing of cases.

The system is designed for continuous operation, with the orchestrator ensuring real-time processing of incoming cases while the dashboard provides visibility into the backlog status.

## Additional Scripts

- `query_db.py`: Query the vector database
- `test_gpu.py`: Test GPU availability for AI processing
- `data-polish.py`: Additional data processing utilities

## Configuration

- Case files: Stored in `pending_cases_json/`
- Queue file: `master_queue.txt`
- Vector DB: `chroma_db_storage/`
- Dashboard: `dashboard/` directory

## Development

- Frontend: `cd dashboard && npm run dev`
- Backend: Modify Python scripts and restart `api_bridge.py`
- AI Models: Ensure API keys are configured for external services (e.g., Groq)