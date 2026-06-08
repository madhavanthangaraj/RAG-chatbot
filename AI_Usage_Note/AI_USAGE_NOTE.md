# AI Usage Note
### L0 Support Chatbot & Knowledge Base System

> An honest account — the wins, the failures, and the one prompt that changed everything.

---

## 🟢 What AI Helped With

| # | Area | What happened |
|---|------|--------------|
| 01 | **System architecture & boilerplate** | Generated the initial folder structures for the Node.js backend, React frontend, and FastAPI AI service. |
| 02 | **RAG pipeline setup** | Wrote core logic for FAISS vector integration, markdown chunking, and embedding generation. |
| 03 | **Writing test suites** | Produced automated tests across Vitest, Mocha/Jest, and Pytest — significantly faster iteration. |
| 04 | **Prompt engineering** | Refined prompts for the local Llama 3.2 model to always cite sources and provide confidence scores. |
| 05 | **UI/UX generation** | Accelerated React component creation with Tailwind CSS — especially the chat interface and analytics dashboard. |

---

## 🔴 What AI Got Wrong

| # | Failure | Fix applied |
|---|---------|-------------|
| 01 | **Hallucinated package imports** — suggested deprecated or nonexistent Python and Node.js packages. | Manual verification against official documentation and package versions. |
| 02 | **Context window limitations** — generating large files or complex modules all at once degraded code quality, leading to syntax errors and missing logic. | Breaking prompts into smaller, modular requests (as seen in `prompt.txt`). |
| 03 | **Complex state management** — struggled with async state updates between the chat UI and backend streaming responses. | Manual debugging and restructuring of React hooks. |
| 04 | **Database migration logic** — SQLite schemas occasionally missed foreign key constraints or had incorrect data types for analytical queries. | Manual schema refinement and validation. |

---

## 🏆 The Best Prompt We Used

The most effective approach was a multi-phase **"Understanding Prompt"** — setting full context *before* generating any code.

```
You are a Senior Software Architect, AI Engineer, Product Designer,
RAG Engineer, MCP Engineer, DevOps Engineer, and Technical Evaluator.

Project Name:
  L0 Self-Service Knowledge Base Chatbot

Business Problem:
  Most support tickets are repetitive "How do I?" questions
  already answered in Knowledge Base articles.

Goal:
  Build an AI-powered self-service support platform that answers
  user questions using a Knowledge Base before escalating to
  human support.

Core Workflow:
  1. User asks a question.
  2. AI searches knowledge base using RAG.
  3. AI generates answer.
  4. AI provides citations.
  5. AI provides confidence score.
  6. If confidence below threshold:
       → Create support ticket.
       → Escalate issue.

Tasks:
  1. Analyze complete project.
  2. Design architecture.
  3. Design database schema.
  4. Design backend modules.
  ...

DO NOT GENERATE CODE.
Only provide architecture and planning.
### Why it worked

Forcing the AI to think about the **whole system** before writing a single line of code eliminated the fragmented, patch-work output that kills AI-assisted projects.

Architecture first. Always.




