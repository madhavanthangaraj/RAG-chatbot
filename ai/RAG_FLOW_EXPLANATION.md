# Understanding the RAG Flow

> **The core idea:** Instead of letting the LLM guess, we force it to *read first, then answer* — using documents we trust.

This is how every user question becomes a grounded, cited response in the L0 Support Chatbot.

---

## The 7-Step Pipeline

### 01 · Ingestion _(runs once at startup)_

When the AI service boots up, it reads every markdown file from the knowledge base. Each file is chunked into passages, then fed through `nomic-embed-text` (via Ollama) to produce a dense vector per chunk. All vectors are written to `ai/data/faiss_index` on disk.

> This only runs once. Every subsequent query hits the cached index — not the raw files.

---

### 02 · User Query _(the question)_

A user types a question into the chat UI:

```
"How do I give feedback about the mess?"
```

The raw text is sent as-is to the AI service backend. No pre-processing, no classification — just the question.

---

### 03 · Query Vectorization _(embedding the question)_

The same `nomic-embed-text` model used during ingestion converts the user's question into a vector.

Using the **same model** is critical — the question and document vectors must live in the same semantic space for comparison to be meaningful.

---

### 04 · Semantic Search _(the comparison)_

The question vector is compared against every document vector in FAISS using **cosine similarity** — measuring the angle between vectors, not raw distance.

Vectors pointing in the same direction share context and meaning. FAISS does this comparison across thousands of chunks in milliseconds.

---

### 05 · Retrieval _(pulling the right document)_

FAISS returns the top-matching chunk — e.g. from `Submitting_Feedback_Suggestions.md`.

The **raw text** of that chunk (not the vector) is pulled out and passed to the next stage. This is the grounding material the LLM will read.

---

### 06 · Augmentation _(building the strict prompt)_

The service constructs a controlled prompt behind the scenes:

```
You are a support bot. Using ONLY the following information, answer
the user's question.

Information: [retrieved chunk from Submitting_Feedback_Suggestions.md]

Question: How do I give feedback about the mess?
```

> The word **ONLY** is doing the heavy lifting here — it constrains the LLM to the retrieved context and prevents hallucination.

---

### 07 · Generation & Response _(Llama 3.2 via Ollama)_

The augmented prompt is sent to the local **Llama 3.2** model. Llama reads the retrieved context, writes a natural-language answer based *only* on that context, and returns it to the user — complete with:

- Source citations (which document was used)
- A confidence score

The user gets a grounded answer, not a guess.

---

## Why This Architecture?

| Without RAG | With RAG |
|-------------|----------|
| LLM guesses from training data | LLM reads from trusted documents |
| Prone to hallucination | Constrained to retrieved context |
| No source citations possible | Citations come naturally |
| Hard to update knowledge | Update the markdown, re-index |

The RAG pipeline solves the most critical problem in support bots: **answering confidently from the right source, not from memory.**
