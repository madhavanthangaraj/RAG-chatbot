# L0 Self-Service Chatbot - FastAPI AI Service

This service provides the AI core logic, implementing **Retrieval-Augmented Generation (RAG)**, an **agent loop**, and a **Model Context Protocol (MCP)** tool interface. It integrates with **Ollama** for local execution.

---

## 🏛️ Architecture Overview

The codebase is organized in a modular structure:
1. **Config (`app/config.py`)**: Centralizes ports, Ollama connections, SQLite file paths, and FAISS vector settings.
2. **Services (`app/services/`)**:
   - `ollama_client.py`: Controls interactions with local Ollama chat models (`llama3.2`) and embedding endpoints (`nomic-embed-text`).
   - `rag_engine.py`: Manages the FAISS index database and metadata mapping, executing cosine similarity checks.
   - `db_sync.py`: Connects directly to the backend's `chatbot.sqlite` to fetch articles, vectorize contents, and build the FAISS index on startup or demand.
3. **Tools (`app/tools/`)**:
   - `base.py`: Defines decorators and classes to build an MCP-compliant tools registry.
   - `kb_tools.py`: Exposes `search_kb` and `retrieve_article` tools.
   - `ticket_tools.py`: Exposes `create_ticket` and `update_ticket` tools (proxies calls to the Node.js REST API).
   - `discord_tools.py`: Exposes `notify_discord` tools.
4. **Core (`app/core/`)**:
   - `agent.py`: Executes the ReAct (Reasoning and Acting) loop, prompting the model, executing intermediate tool actions, appending observations, and returning structured final responses.
   - `prompt.py`: System instructions and formatting templates.
   - `mcp_server.py`: Maps registered tools to standard MCP schemas for external client ingestion.
5. **Models (`app/models/schemas.py`)**: Pydantic models for validation.

---

## 🔌 API Endpoints

### 1. `/api/agent/query` [POST]
Executes the ReAct agent loop for customer queries.
- **Request Body**:
  ```json
  {
    "userId": "user-uuid",
    "query": "How do I configure Vite setup guidelines?"
  }
  ```
- **Response**:
  ```json
  {
    "reply": "According to our setup guide...",
    "confidenceScore": 0.9,
    "citations": [
      {
        "article_id": "art-uuid",
        "title": "Vite Setup Guide",
        "snippet": "To install Vite..."
      }
    ],
    "suggestedFollowups": ["What is the prerequisite for this?"],
    "escalated": false,
    "ticketId": null
  }
  ```

### 2. `/api/kb/sync` [POST]
Manual trigger route to parse SQLite articles and re-build the FAISS index.

### 3. `/mcp/tools` [GET]
Lists all tools available on this service with their parameter descriptions.

### 4. `/mcp/tools/execute` [POST]
Executes a specific tool by name. Used by external MCP clients.

---

## 🛠️ Getting Started

### Prerequisites
1. **Ollama** must be installed and running locally.
2. Download the required models:
   ```bash
   ollama pull llama3.2
   ollama pull nomic-embed-text
   ```

### Running Locally
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Run the application:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
