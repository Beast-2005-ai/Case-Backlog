# Annexure: Prior Art Search & Comparison Report
## Title of Invention: CaseTriage: Dual-Engine AI-Based Orchestration System for Automated Legal Case Triage, Prioritization, and Explainable Urgency Scoring

---

This Annexure details the patent search results conducted in relation to the CaseTriage system, highlighting key prior art patents and documenting why the present invention is novel and non-obvious.

### 1. US10157352B1: Artificial Intelligence, Machine Learning, and Predictive Analytics for Patent and Non-Patent Documents
* **Assignee:** IP.com / Prior Art Publishing, LLC
* **Published:** 2018-12-18
* **Description:** Details a system utilizing machine learning and predictive analytics to analyze unstructured text in legal/patent documents, calculating semantic relationships to categorize and rank documents based on domain similarity.
* **Comparison & Novelty of CaseTriage:**
  * While US10157352B1 uses machine learning to classify and rank legal documents, it relies purely on statistical ML predictions.
  * **CaseTriage** introduces a hybrid **Dual-Engine Scoring Pipeline** combining dynamic heuristic rule engines (40% weight) with an XGBoost ML model (60% weight).
  * **CaseTriage** further integrates real-time **Shapley Additive Explanations (SHAP)** to explain the exact positive/negative mathematical point contribution of features for judicial auditability, which is absent in US10157352B1.

### 2. US9367604B2: Systems, Methods, and Interfaces for Extending Legal Search Results
* **Assignee:** Thomson Reuters Global Resources
* **Published:** 2016-06-14
* **Description:** Details methods for semantic clustering of legal documents and extending legal search results based on key legal topics and term frequencies to surface historical legal precedents.
* **Comparison & Novelty of CaseTriage:**
  * US9367604B2 focuses on retrieving and grouping related legal precedents for research purposes.
  * **CaseTriage** embeds case facts dynamically using SentenceTransformers (`all-MiniLM-L6-v2`) and integrates a local vector database (ChromaDB) to surface precedents directly inside the triage workflow.
  * **CaseTriage** features a unique **Self-Excluding Search Filter** (checking for cosine similarity distance < 0.05). If the nearest matched precedent is the case itself (which occurs during updates or duplicate checks), it dynamically bypasses it to surface the next closest true historical precedent.

### 3. US11195116B2: Systems and Methods for Automated Document Classification and Routing Workflow
* **Assignee:** LexisNexis / Reed Elsevier Inc.
* **Published:** 2021-12-07
* **Description:** Outlines systems and methods for using machine learning models to automatically classify, assign priority, and route incoming litigation dockets and legal workflows.
* **Comparison & Novelty of CaseTriage:**
  * US11195116B2 covers automated priority assignment and routing for litigation files, but does not provide dynamic rule configurations or collision safety.
  * **CaseTriage** features **Dynamic Configuration Stacking**, allowing administrators to edit keyword-weight profiles in a live environment and merge them additively with the Base Urgency Dictionary without system downtime.
  * **CaseTriage** solves queue-sorting issues by using a **Deterministic Sorting Jitter** (an MD5 hash of the unique Case ID combined with text length). This guarantees collision-free case ranking, preventing prioritization ties in massive queues.
