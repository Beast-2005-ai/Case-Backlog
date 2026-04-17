# ⚖️ CaseTriage: AI-Powered Legal Backlog Optimization Engine

## 📖 Description
CaseTriage is an enterprise-grade, full-stack orchestration system designed to automate the triage and prioritization of massive legal casework backlogs. 

Instead of relying on manual sorting, CaseTriage utilizes a dual-engine AI approach. It ingests raw legal dockets, categorizes them by region (US, India, International) and law type, and scores their urgency using both a dynamic heuristic rule engine and a trained XGBoost Machine Learning model. 

**Key Features:**
* **Intelligent Triage Queue:** Instantly scores and ranks cases from 1 to 100 based on legal urgency and keyword density.
* **Explainable AI (XAI):** Utilizes SHAP (SHapley Additive exPlanations) to mathematically break down exactly *why* the ML model assigned a specific score, ensuring judicial transparency.
* **Precedent Surfacing:** Integrates with a local Vector Database (ChromaDB) to instantly surface the closest historical legal precedent for any new case.
* **Dynamic Configuration:** Administrators can build, deploy, and stack custom scoring profiles and keyword weights on the fly directly from the UI—no coding required.
* **System Analytics:** A comprehensive telemetry dashboard featuring live, 3-way regional comparisons (US, India, Overall) across priority histograms, category doughnuts, and keyword radar charts.
* **PDF Reporting:** One-click generation of beautifully formatted, print-ready docket reports.

---

## 🛠️ Tech Stack

**Frontend:**
* **React (TypeScript):** Core UI framework.
* **Tailwind CSS:** For custom dark-mode styling and responsive design.
* **Recharts:** High-performance data visualization and analytics.
* **Framer Motion:** Fluid, physics-based UI animations.
* **Lucide-React:** Consistent iconography.

**Backend & AI Engine:**
* **Python:** Core backend and ML orchestration.
* **FastAPI & Uvicorn:** High-performance REST API bridge.
* **Watchdog:** Real-time file system monitoring for automated ingestion.
* **XGBoost:** Gradient boosted tree model for priority regression.
* **ChromaDB & SentenceTransformers:** Vector database and embeddings for semantic precedent matching.
* **SHAP:** Explainable AI framework for feature impact analysis.

---

## 🚀 Getting Started

### Prerequisites
Before you begin, ensure you have the following installed on your machine:
* **Python 3.9** or higher
* **Node.js** (v16+ recommended)

### 1. Installation & Setup
Clone or extract the repository, then install the required dependencies for both the backend and frontend.

**Backend Setup:**
Open a terminal in the root directory and install the Python dependencies:
```bash
pip install -r requirements.txt

Frontend Setup:
Open a terminal in your frontend directory (where package.json is located) and install the Node packages:

npm install
npm install recharts lucide-react framer-motion

### 2. Running the system
The CaseTriage architecture runs on three separate micro-processes. You will need to open three separate terminal windows.

Terminal 1: Start the API Bridge
Navigate to the root Python directory and boot the FastAPI server.

python api_bridge.py

The API is now listening on localhost:8000.

Terminal 2: Start the React Dashboard
Navigate to the frontend directory and start the UI server.

npm run dev
# OR npm start (depending on your environment setup)
Open your browser to the localhost link provided. The system will show as "Idle" until the Watchdog is booted.

Terminal 3: Boot the AI Watchdog Orchestrator
Navigate to the root Python directory and awaken the automated scoring engine.

python watchdog-orchestrator.py
The Watchdog will immediately scan the pending_cases_json folders, process any waiting cases through the XGBoost model and Vector DB, and begin monitoring for live drops.

📂 Folder Structure & Routing
When cases are uploaded via the UI or dropped manually, the API automatically scans the text and routes them into the pending_cases_json/ directory under one of three subfolders:

/US - Triggered by terms like SCOTUS, Federal Court, Texas

/Indian - Triggered by terms like IPC, CrPC, High Court

/International - Fallback for globally ambiguous cases