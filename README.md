# 🏛️ L0 Support Chatbot & Knowledge Base System

## 📌 Project Overview

The L0 Support Chatbot & Knowledge Base System is a local-first, AI-assisted customer support platform designed to automate repetitive support requests and reduce manual intervention.

The system enables users to search a knowledge base using natural language queries and receive instant answers through semantic search and intelligent retrieval mechanisms. When relevant information is unavailable, the system automatically escalates the request by creating a support ticket for further assistance.

The platform follows a microservices architecture and operates completely on local infrastructure, ensuring privacy, offline capability, low operational cost, and reduced dependency on external cloud AI services.

---

# 🎯 Business Problem

Customer support teams frequently receive repetitive questions such as:

* How do I reset my password?
* How do I update my profile?
* How do I submit feedback?
* How do I create a support ticket?

These questions are often already documented in internal knowledge base articles, yet support agents continue spending time answering them manually.

This project solves the problem by:

* Providing instant self-service answers.
* Reducing support workload.
* Improving response times.
* Automating ticket creation when answers are unavailable.
* Maintaining service availability through intelligent fallback mechanisms.

---

# 🚀 Key Features

## User Features

* Natural language chatbot interface
* Knowledge base article retrieval
* Typo-tolerant search
* Semantic search using vector embeddings
* Chat history management
* Automatic ticket creation when no answer is found

## Admin Features

* User management
* Knowledge base management
* Ticket management
* Analytics dashboard
* Feedback monitoring
* System logs monitoring

## AI Features

* Spell correction
* Query normalization
* Semantic similarity search
* Retrieval-Augmented Generation (RAG-style retrieval)
* Intelligent ranking and reranking
* Context-aware article matching

## Reliability Features

* Backend fallback search
* Offline execution support
* Local AI inference
* Automated testing suite
* Service isolation through microservices

---

# 🏗️ System Architecture

```text
                    ┌─────────────────────┐
                    │       User          │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      Frontend       │
                    │ React + Vite        │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      Backend        │
                    │ Node.js + Express   │
                    └──────────┬──────────┘
                               │
              ┌────────────────┴───────────────┐
              ▼                                ▼

    ┌──────────────────┐           ┌──────────────────┐
    │ Processing       │           │ SQLite Database  │
    │ Service          │           │ chatbot.sqlite   │
    │ FastAPI          │           └──────────────────┘
    └─────────┬────────┘
              │
              ▼
    ┌──────────────────┐
    │ Local Runtime    │
    │ Engine           │
    └─────────┬────────┘
              │
              ▼
    ┌──────────────────┐
    │ FAISS Vector DB  │
    └──────────────────┘
```

---

# 🧩 System Components

## 💻 Frontend

### Technology Stack

* React
* Vite
* JavaScript
* React Router
* Axios

### Port

```text
5173
```

### Responsibilities

* Landing page
* Chat interface
* Admin dashboard
* Analytics visualization
* Ticket management UI
* User interaction handling

---

## ⚙️ Backend Service

### Technology Stack

* Node.js
* Express.js
* JWT Authentication
* SQLite Integration

### Port

```text
5000
```

### Responsibilities

* Authentication
* Session handling
* User management
* Ticket APIs
* Knowledge base APIs
* Logging system
* Fallback keyword search

---

## 🧠 AI Processing Service

### Technology Stack

* Python
* FastAPI
* FAISS
* NLP Utilities

### Port

```text
8000
```

### Responsibilities

* Query preprocessing
* Spell correction
* Query normalization
* Embedding generation
* Semantic retrieval
* Article reranking
* Response generation

---

## ⚡ Local Runtime Engine

### Port

```text
11434
```

### Responsibilities

* Local model execution
* Embedding generation
* Offline AI inference
* Zero cloud dependency

### Benefits

* Enhanced privacy
* Reduced API costs
* Faster local response times
* Offline operation

---

## 🗄️ Database

### Technology

SQLite

### Database File

```text
chatbot.sqlite
```

### Stores

* Users
* Roles
* Chat history
* Tickets
* Knowledge base articles
* Logs
* Feedback records

---

## 🔍 Vector Search Engine

### Technology

FAISS (Facebook AI Similarity Search)

### Purpose

* Store embeddings
* Semantic similarity search
* Knowledge base retrieval
* Fast nearest-neighbor matching

### Benefits

* High-speed search
* Improved answer relevance
* Better semantic understanding

---

# 🔄 Query Processing Workflow

## Step 1

User submits a question through the chatbot interface.

Example:

```text
How can I reset my passward?
```

---

## Step 2

The processing service performs:

* Text cleaning
* Spell correction
* Query normalization

Corrected query:

```text
How can I reset my password?
```

---

## Step 3

The query is converted into vector embeddings.

---

## Step 4

FAISS performs semantic similarity search.

---

## Step 5

Relevant knowledge base articles are retrieved.

---

## Step 6

Articles are reranked based on:

* Semantic relevance
* Keyword relevance
* Title matching
* Confidence score

---

## Step 7

Best answer is returned to the user.

---

## Step 8

If no relevant answer exists:

* Support ticket is automatically generated.
* Ticket is assigned for manual review.

---

# 🔁 Fallback Search Workflow

If the AI Processing Service becomes unavailable:

```text
Frontend
    ↓
Backend
    ↓
Local Keyword Search
    ↓
SQLite Database
```

The backend continues providing answers using exact keyword matching.

This ensures uninterrupted service.

---

# 📊 Search Ranking Logic

## Exact Title Match

Highest priority

```text
+20 Points
```

---

## Keyword Match In Title

```text
+10 Points
```

---

## Partial Title Match

```text
+5 Points
```

---

## Content Match

```text
+1 Point
```

---

## Tie Breaker

Uses:

```text
effectiveness_score
```

to prioritize higher quality articles.

---

# 🧪 Testing Strategy

The project includes automated testing across all major layers.

---

## 1. Python AI Tests

### Command

```bash
python -m pytest testing
```

### Validations

* Levenshtein distance calculations
* Typo tolerance thresholds
* Spell correction accuracy
* Query normalization
* Vocabulary matching

---

## 2. Backend Tests

### Command

```bash
node testing/test_backend_happy_path.js
```

### Validations

* Fallback search behavior
* Title relevance scoring
* Content scoring
* Exact match boosting
* Stopword filtering
* Tie-breaker ranking

---

## 3. Frontend Tests

### Command

```bash
cd frontend
npx vitest run --root=../ testing
```

### Validations

* Status style mappings
* Priority style mappings
* Component behavior
* Repository mocking
* Search result rendering

---

## Run Complete Test Suite

```bash
python -m pytest testing;
node testing/test_backend_happy_path.js;
cd frontend;
npx vitest run --root=../ testing;
cd ..
```

---

# ⚙️ Installation Guide

## Prerequisites

* Node.js 18+
* Python 3.9+
* SQLite
* Local Runtime Engine

---

## AI Service Setup

```bash
cd ai
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

---

## Backend Setup

```bash
cd backend
npm install
```

Create `.env`

```env
PORT=5000
DATABASE_URL=sqlite://../chatbot.sqlite

JWT_SECRET=your_secret_key
JWT_REFRESH_SECRET=your_refresh_secret

JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

NODE_ENV=development
```

---

## Frontend Setup

```bash
cd frontend
npm install
cd ..
```

---

# 🚀 Running the Application

## Start AI Processing Service

```bash
cd ai
.\venv\Scripts\activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## Start Backend

```bash
cd backend
npm run dev
```

---

## Start Frontend

```bash
cd frontend
npm run dev
```

---

## Access Application

```text
http://localhost:5173
```

---

# 📈 Advantages of the System

* Fully local execution
* No cloud AI dependency
* Faster response times
* Lower operational costs
* Privacy-focused architecture
* Automated support handling
* Intelligent fallback mechanism
* Scalable microservices architecture
* Comprehensive automated testing

---

# 🔮 Future Enhancements

* Discord integration
* Email notifications
* Multi-language support
* Role-based access control improvements
* Advanced analytics dashboard
* Docker containerization
* Cloud deployment support
* Multi-model AI routing
* Voice-based support assistant

---

# 📋 Conclusion

The L0 Support Chatbot & Knowledge Base System provides an intelligent, scalable, and reliable solution for automating repetitive customer support requests. By combining semantic search, vector retrieval, typo correction, automated ticket escalation, and local AI inference, the platform significantly reduces support workload while improving user experience and response efficiency.

The system is production-oriented, extensively tested, and designed to operate effectively even when individual services become unavailable through its robust fallback architecture.
