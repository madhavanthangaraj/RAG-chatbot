import json
import re
from typing import Dict, Any, List, Tuple
from ..services.ollama_client import ollama_client
from ..services.rag_engine import rag_engine
from ..tools.base import registry

class RAGAgent:
    def __init__(self, confidence_threshold: float = 0.30):
        self.confidence_threshold = confidence_threshold
        # Standard stopwords list for TF-IDF ranking heuristic
        self.stopwords = {
            "the", "is", "at", "which", "on", "a", "an", "and", "or", "in", 
            "of", "to", "for", "with", "about", "how", "what", "where", "why", "who", "are", "you"
        }

    def _levenshtein_distance(self, s1: str, s2: str) -> int:
        if len(s1) < len(s2):
            return self._levenshtein_distance(s2, s1)
        if len(s2) == 0:
            return len(s1)
        
        previous_row = range(len(s2) + 1)
        for i, c1 in enumerate(s1):
            current_row = [i + 1]
            for j, c2 in enumerate(s2):
                insertions = previous_row[j + 1] + 1
                deletions = current_row[j] + 1
                substitutions = previous_row[j] + (c1 != c2)
                current_row.append(min(insertions, deletions, substitutions))
            previous_row = current_row
            
        return previous_row[-1]

    def _is_fuzzy_match(self, word1: str, word2: str) -> bool:
        """Fuzzy string matching using Levenshtein distance for typo tolerance."""
        if word1 == word2:
            return True
        # If length is too small, don't allow fuzzy mismatch
        if len(word1) < 4 or len(word2) < 4:
            return False
        dist = self._levenshtein_distance(word1, word2)
        # Allow maximum 1 edit for short words (4-5 chars), 2 edits for longer words
        max_edit = 1 if max(len(word1), len(word2)) <= 5 else 2
        return dist <= max_edit

    def _correct_query_spelling(self, query: str) -> str:
        """Corrects spelling of words in the query if they are close fuzzy matches to KB title words."""
        # Collect vocab from RAG engine metadata
        vocab = set()
        for meta in rag_engine.chunks_metadata.values():
            title = meta.get("title", "")
            clean_t = re.sub(r'[^a-zA-Z0-9\s]', ' ', title.lower())
            vocab.update(clean_t.split())
            
        # Clean and split query into tokens, keeping spacing
        words = query.split()
        corrected_words = []
        for w in words:
            # Strip punctuation from word for matching
            w_clean = re.sub(r'[^a-zA-Z0-9]', '', w.lower())
            if w_clean in vocab or len(w_clean) < 3 or w_clean in self.stopwords:
                corrected_words.append(w)
                continue
                
            # Check for close fuzzy match in vocab
            corrected_w = w
            for vocab_w in vocab:
                if self._is_fuzzy_match(w_clean, vocab_w):
                    corrected_w = vocab_w
                    break
            corrected_words.append(corrected_w)
            
        return " ".join(corrected_words)

    # ==========================================
    # Step 3: Heuristic Keyword Re-Ranking
    # ==========================================
    def _rank_results(self, query: str, retrieved_docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Re-ranks retrieved documents combining FAISS cosine score and query term density."""
        if not retrieved_docs:
            return []

        # Tokenize query terms, converting non-alphanumeric characters to space first
        clean_query_str = re.sub(r'[^a-zA-Z0-9\s]', ' ', query.lower())
        query_words = [w for w in clean_query_str.split() if w not in self.stopwords]
        if not query_words:
            query_words = [w for w in clean_query_str.split()]

        ranked_docs = []
        for doc in retrieved_docs:
            content = doc.get("content", "").lower()
            title = doc.get("title", "").lower()
            
            # Clean title for matching
            clean_title_str = re.sub(r'[^a-zA-Z0-9\s]', ' ', title)
            title_words = clean_title_str.split()
            
            # Clean content for matching
            clean_content_str = re.sub(r'[^a-zA-Z0-9\s]', ' ', content)
            content_words = clean_content_str.split()
            
            # Count word matches with fuzzy matching
            matches = 0
            for qw in query_words:
                # Check title
                title_match = any(self._is_fuzzy_match(qw, tw) for tw in title_words)
                if title_match:
                    matches += 2.0
                else:
                    # Check content
                    content_match = any(self._is_fuzzy_match(qw, cw) for cw in content_words)
                    if content_match:
                        matches += 1.0
            
            density = matches / max(len(query_words), 1)
            
            # Check for exact title match (ignoring case/whitespace/punctuation)
            norm_query = re.sub(r'[^a-zA-Z0-9]', '', query).lower()
            norm_title = re.sub(r'[^a-zA-Z0-9]', '', title).lower()
            
            if norm_query == norm_title and norm_query != "":
                # Force maximum density/rank boost for exact title match
                density = 5.0
            
            # Combine FAISS distance/score (70%) and keyword density (30%)
            faiss_score = doc.get("score", 0.0)
            combined_score = (0.7 * faiss_score) + (0.3 * density)
            
            # Keep copy and append combined score
            ranked_doc = doc.copy()
            ranked_doc["combined_score"] = combined_score
            ranked_docs.append(ranked_doc)

        # Sort descending by combined score
        ranked_docs.sort(key=lambda x: x["combined_score"], reverse=True)
        return ranked_docs

    # ==========================================
    # Step 5: Self-Evaluation Check & Confidence
    # ==========================================
    async def _evaluate_confidence(self, query: str, top_doc: Dict[str, Any]) -> Tuple[float, bool]:
        """Calculates final confidence score based on word overlap between query and title."""
        # Normalize and clean strings
        clean_query = re.sub(r'[^a-zA-Z0-9]', '', query).lower()
        clean_title = re.sub(r'[^a-zA-Z0-9]', '', top_doc.get("title", "")).lower()
        
        # Check 1: Exact match
        if clean_query == clean_title and clean_query != "":
            return 1.0, True

        # Check 2: Calculate word overlap ratio
        # Split query and title into individual words
        query_words = [w for w in re.sub(r'[^a-zA-Z0-9\s]', ' ', query).lower().split() if w]
        title_words = [w for w in re.sub(r'[^a-zA-Z0-9\s]', ' ', top_doc.get("title", "")).lower().split() if w]
        
        if not query_words:
            return 0.0, False
            
        matched_count = 0
        for qw in query_words:
            # Check if qw fuzzy matches any word in title
            if any(self._is_fuzzy_match(qw, tw) for tw in title_words):
                matched_count += 1
                
        overlap_ratio = matched_count / len(query_words)
        
        # Limit to 1.0 max, round to 2 decimal places
        overlap_ratio = min(round(overlap_ratio, 2), 1.0)
        
        # If overlap is greater than 30%, it is considered relevant (doesn't escalate)
        is_relevant = overlap_ratio > 0.30
        
        return overlap_ratio, is_relevant

    # ==========================================
    # Step 6: Escalation Logic
    # ==========================================
    async def _execute_escalation(self, query: str, user_id: str) -> Tuple[str, str]:
        """Triggers support ticket creation and alerts support agents via Discord."""
        ticket_tool = registry.get_tool("create_ticket")
        discord_tool = registry.get_tool("notify_discord")
        
        ticket_id = None
        
        # Log a support ticket in backend SQLite
        if ticket_tool:
            ticket_args = {
                "user_id": user_id,
                "subject": f"Auto-escalation: {query[:35]}...",
                "description": f"Customer asked: '{query}'. AI service triggered auto-escalation fallback due to low confidence scores.",
                "priority": "high",
                "category": "AI Escalated"
            }
            try:
                ticket_res = await ticket_tool.execute(ticket_args)
                if ticket_res.get("status") == "success" or "data" in ticket_res:
                    data = ticket_res.get("data", ticket_res)
                    ticket_id = data.get("id")
            except Exception as e:
                print(f"Error executing ticket tool during escalation: {e}")

        # Send alert notification to Discord channel
        if discord_tool:
            alert_msg = f"⚠️ Escalation Alert: Customer question failed AI resolution.\nQuery: '{query}'\nLogged Ticket ID: {ticket_id or 'Failed to log'}"
            try:
                await discord_tool.execute({"message": alert_msg, "channel_type": "urgent"})
            except Exception as e:
                print(f"Error executing Discord tool during escalation: {e}")
                
        return True, ticket_id

    # ==========================================
    # Main Agent Pipeline Loop
    # ==========================================
    async def execute(self, query: str, user_id: str) -> Dict[str, Any]:
        """Runs the query through the pipeline: Retrieve -> Rank -> Generate -> Confidence -> Escalation."""
        citations = []
        escalated = False
        ticket_id = None
        reply = "No relevant Knowledge Base article was found for your request."
        confidence = 0.0
        is_relevant = False
        
        try:
            # Step 1: Correct query spelling typos
            corrected_query = self._correct_query_spelling(query)
            
            # Step 2: Retrieve relevant chunks
            retrieved_docs = await rag_engine.search(query=corrected_query, top_k=5)
            
            # Step 3: Heuristic Keyword Re-Ranking
            ranked_docs = self._rank_results(corrected_query, retrieved_docs)
            
            # Step 4: Generate Answer
            if ranked_docs:
                top_doc = ranked_docs[0]
                
                # Step 5: Self-Evaluation Check & Confidence Calculations
                confidence, is_relevant = await self._evaluate_confidence(corrected_query, top_doc)
                
                if is_relevant and confidence >= self.confidence_threshold:
                    # Context is relevant and passes threshold: construct prompt and generate answer
                    rag_prompt = f"""You are a helpful customer support agent.
Answer the user's question using ONLY the provided Knowledge Base context.
If the answer is not present in the context, state that you do not know.

Context:
{top_doc.get("content", "")}

User Question:
{corrected_query}

Answer:
"""
                    messages = [
                        {"role": "system", "content": "You answer questions factually using the provided context."},
                        {"role": "user", "content": rag_prompt}
                    ]
                    
                    generation = await ollama_client.generate_chat_completion(messages, temperature=0.2)
                    reply = generation.get("content", "").strip()
                    reply += f"\n\n🤖 *Response processed by local Ollama AI (Model: llama3.2)*"
                    
                    # Store citation reference
                    citations.append({
                        "article_id": top_doc.get("id"),
                        "title": top_doc.get("title"),
                        "snippet": top_doc.get("content", "")[:150] + "..."
                    })
                else:
                    # Top document is irrelevant or failed threshold check
                    reply = "No relevant Knowledge Base article was found for your request."
                    confidence = 0.0
                    is_relevant = False
                    citations = []
            else:
                reply = "No relevant Knowledge Base article was found for your request."
                confidence = 0.0
                is_relevant = False
                citations = []
                
        except Exception as e:
            print(f"Exception in Agent execute: {str(e)}")
            reply = "No relevant Knowledge Base article was found for your request."
            confidence = 0.0
            is_relevant = False
            citations = []

        # Step 6: Escalation Decision
        if not is_relevant or confidence < self.confidence_threshold:
            escalated, ticket_id = await self._execute_escalation(query, user_id)
            
            try:
                messages = [
                    {"role": "system", "content": "You are a polite customer support assistant. Tell the user you searched the Knowledge Base but could not find a matching guide for their query, and that a support ticket has been opened to resolve this. Keep the response to 1 or 2 sentences."},
                    {"role": "user", "content": f"The user asked: '{query}'. Write a concise response explaining that no guide was found in the database and a ticket has been opened."}
                ]
                generation = await ollama_client.generate_chat_completion(messages, temperature=0.7)
                ollama_reply = generation.get("content", "").strip()
            except Exception as e:
                ollama_reply = "No relevant Knowledge Base article was found for your request."

            reply = ollama_reply
            reply += f"\n\n📝 A support ticket has been automatically created and assigned to the appropriate support team for further investigation. Our team will review your request and respond as soon as possible.\n\nThank you for your patience."
            reply += f"\n\n🤖 *Response processed by local Ollama AI (Model: llama3.2)*"
            
            suggested_followups = [
                "Track my escalated ticket status",
                "How long does manual ticket resolution take?"
            ]
        else:
            suggested_followups = [
                f"Can you explain more about {citations[0]['title']}?",
                "Are there any other prerequisites?"
            ]
            
        return {
            "reply": reply,
            "confidenceScore": confidence,
            "citations": citations,
            "suggestedFollowups": suggested_followups,
            "escalated": escalated,
            "ticketId": ticket_id
        }

# Singleton instance
react_agent = RAGAgent()
