# 🏛️ L0 Support Chatbot & Knowledge Base System

## 📌 Overview

This is a local-first, microservices-based customer support system designed to handle repetitive "how do I" queries using a knowledge base, fallback search, and semantic retrieval.

The system provides:
- Web-based chat interface
- Admin dashboard for knowledge base and ticket management
- Intelligent query handling with fallback logic
- Offline-capable local processing

---

## 🔗 System Architecture
User → Frontend → Backend → Processing Service → Local Runtime Engine
↓ ↓
SQLite DB Vector Search Index (FAISS)


---

## 🧩 Components

### 💻 Frontend
- Port: 5173
- Stack: React, Vite
- Features:
  - Landing page with project details, key stack insights, and CTA navigation
  - Chat interface
  - Admin dashboard
  - Analytics view
  - Ticket management UI

---

### ⚙️ Backend
- Port: 5000
- Stack: Node.js, Express
- Responsibilities:
  - Authentication & sessions
  - User management
  - Tickets handling
  - Knowledge base APIs
  - Logging system
  - Fallback keyword search

---

### 🧠 Processing Service
- Port: 8000
- Stack: FastAPI (Python)
- Responsibilities:
  - Query processing pipeline
  - Semantic search (RAG-style retrieval)
  - Spell correction & normalization
  - Intelligent routing

---

### ⚡ Local Runtime Engine
- Port: 11434
- Responsibilities:
  - Local inference execution
  - Embeddings generation
  - Offline processing support

---

### 🗄️ Database
- Type: SQLite
- File: chatbot.sqlite
- Stores:
  - Users
  - Chat history
  - Tickets
  - Knowledge base articles
  - Logs & feedback

---

### 🔍 Vector Search Engine
- Technology: FAISS
- Purpose:
  - Semantic similarity search
  - Fast retrieval of KB articles
  - Embedding-based ranking

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- Local runtime engine running

---

## 🧠 Processing Service Setup

```powershell
cd ai
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
cd ..


⚙️ Backend Setup
cd backend
npm install

Create .env:

PORT=5000
DATABASE_URL=sqlite://../chatbot.sqlite
JWT_SECRET=your_secret_key
JWT_REFRESH_SECRET=your_refresh_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
NODE_ENV=development
cd ..
💻 Frontend Setup
cd frontend
npm install
cd ..
🚀 Running the System
Start Local Runtime Engine

Ensure it is running in background.

Start Processing Service
cd ai
.\venv\Scripts\activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
Start Backend
cd backend
npm run dev
Start Frontend
cd frontend
npm run dev

App runs at:

http://localhost:5173
🧪 Testing
Python Tests
python -m pytest testing
Backend Tests
node testing/test_backend_happy_path.js
Frontend Tests
cd frontend
npx vitest run --root=../ testing
Run All Tests
python -m pytest testing;
node testing/test_backend_happy_path.js;
cd frontend;
npx vitest run --root=../ testing;
cd ..
🧠 System Behavior
Performance
Fully local execution
Speed depends on hardware (CPU/GPU)
Database
SQLite-based storage
Best for lightweight workloads
May lock under heavy concurrent writes
Vector Index
Cached FAISS index
Requires manual sync after KB updates
Fallback Search Logic

When processing service is unavailable:

Exact match → highest priority
Partial match → medium score
Content match → low score
Full token match → boosted ranking
Tie-breaker → relevance score