# 📁 Sample Data Folder - Ingestion & Expected Outputs

This directory contains reference sample inputs and expected JSON outputs to verify, ingest, and test the RAG chatbot's capabilities.

---

## 📂 Directory Structure

```
sample_data/
├── README.md               # This documentation file
├── inputs/                 # Sample files that can be uploaded into the Knowledge Base
│   ├── Instructions_to_Pay_Student_Fees.md
│   ├── Reset_Student_Password_Guide.md
│   └── Submitting_Feedback_Suggestions.md
└── outputs/                # Expected JSON output structures from search & agent execution
    ├── agent_response_fees.json
    ├── agent_response_password.json
    └── fallback_search_feedback.json
```

---

## 📥 Input Files (`inputs/`)

These files represent clean Markdown (`.md`) guides that conform to the single-format ingestion specifications of the **Antigravity** system:

1. **`Reset_Student_Password_Guide.md`**: Outlines steps for students to request, receive, and configure a new portal login password using the `/login` route.
2. **`Instructions_to_Pay_Student_Fees.md`**: Provides payment method details, processing windows, and receipt download instructions.
3. **`Submitting_Feedback_Suggestions.md`**: Instructs students on providing Academic, Facilities, and ERP system suggestions.

### Ingestion Verification:
You can test the ingestion mechanism by going to the admin dashboard (under the **Knowledge Base** tab in the UI), and dragging-and-dropping any of these files into the dropzone. Alternatively, you can write them directly to the database or trigger the sync command:
```powershell
# Sync SQLite metadata to rebuild vector index (FAISS)
Invoke-RestMethod -Method Post -Uri "http://localhost:8000/api/kb/sync"
```

---

## 📤 Expected Outputs (`outputs/`)

These JSON mock files showcase the expected server responses under different query contexts:

### 1. AI Agent RAG Response (Ollama Online)
When the FastAPI AI Service and Ollama are fully online, sending query payloads returns structured RAG objects.

* **Test Query 1**: `"how to reset password"`
  - **Expected JSON**: `outputs/agent_response_password.json`
  - **Details**: Contains the full Markdown reply, a confidence score of `1.0` (100% match boost triggered by title alignment), exact citation attributes linking back to the article ID, and suggested follow-up questions.
  
* **Test Query 2**: `"how to pay fees"`
  - **Expected JSON**: `outputs/agent_response_fees.json`
  - **Details**: Matches the `Instructions to Pay Student Fees` article, yielding a `1.0` confidence score and structured citations.

### 2. Backend Fallback Search (AI Service Offline)
If the Python AI service is offline, the Node.js backend handles search using keyword density match scoring.

* **Test Query**: `"suggestions on hostel"`
  - **Expected JSON**: `outputs/fallback_search_feedback.json`
  - **Details**: Demonstrates token-based fallback matching. Because the keyword `"suggestions"` appears in the title of `Submitting Feedback & Suggestions` and `"hostel"` matches the title/body of `Hostel Room Allotment Guide`, the system ranks them by title/body match scores, using `effectiveness_score` as a secondary sorting weight (sorting the 5.0 score article above the 4.5 score one).
