import os
import pickle
import io
import re
import numpy as np
import faiss
from typing import List, Dict, Any, Optional
from ..config import settings
from .ollama_client import ollama_client

class RAGEngine:
    def __init__(self):
        self.index_dir = settings.FAISS_INDEX_DIR
        self.dimension = settings.VECTOR_DIMENSION
        self.index_path = os.path.join(self.index_dir, "index.faiss")
        self.meta_path = os.path.join(self.index_dir, "metadata.pkl")
        
        self.index = None
        self.chunks_metadata: Dict[str, Dict[str, Any]] = {} # Maps chunk ID -> metadata details
        self.id_map: List[str] = []  # Maps FAISS index row index -> chunk ID string
        
        self._initialize_index()

    def _initialize_index(self):
        """Loads index files from disk or creates new empty FAISS structures."""
        os.makedirs(self.index_dir, exist_ok=True)
        
        if os.path.exists(self.index_path) and os.path.exists(self.meta_path):
            try:
                self.index = faiss.read_index(self.index_path)
                with open(self.meta_path, "rb") as f:
                    data = pickle.load(f)
                    self.chunks_metadata = data.get("chunks_metadata", {})
                    self.id_map = data.get("id_map", [])
            except Exception as e:
                print(f"Error loading FAISS index, building fresh: {e}")
                self._create_fresh_index()
        else:
            self._create_fresh_index()

    def _create_fresh_index(self):
        """Creates a fresh empty FAISS inner-product index for cosine similarity."""
        self.index = faiss.IndexFlatIP(self.dimension)
        self.chunks_metadata = {}
        self.id_map = []
        self.save_index()

    def save_index(self):
        """Persists the FAISS index and metadata mappings to disk."""
        faiss.write_index(self.index, self.index_path)
        with open(self.meta_path, "wb") as f:
            pickle.dump({
                "chunks_metadata": self.chunks_metadata,
                "id_map": self.id_map
            }, f)

    # ==========================================
    # Parsing Helpers (Markdown, CSV, JSON)
    # ==========================================

    def parse_markdown_chunks(self, text: str, max_chunk_size: int = 500, overlap: int = 50) -> List[str]:
        """Parses Markdown document, chunking by headers and paragraph thresholds."""
        chunks = []
        # Split by headers (e.g. #, ##, ###) while retaining the header title in context
        header_sections = re.split(r'(^#+\s+.*$)', text, flags=re.MULTILINE)
        
        current_header = "General Guide"
        current_text = ""
        
        for section in header_sections:
            if not section.strip():
                continue
                
            if section.startswith('#'):
                # Save previous accumulated text as chunks before starting new header
                if current_text.strip():
                    chunks.extend(self._split_text_block(current_text, current_header, max_chunk_size, overlap))
                current_header = section.replace('#', '').strip()
                current_text = ""
            else:
                current_text += section
                
        # Flush remaining text
        if current_text.strip():
            chunks.extend(self._split_text_block(current_text, current_header, max_chunk_size, overlap))
            
        return chunks

    def _split_text_block(self, text: str, context_header: str, max_size: int, overlap: int) -> List[str]:
        """Helper to split a long paragraph into overlapping blocks, prepending header context."""
        words = text.split()
        if not words:
            return []
            
        chunks = []
        text_content = " ".join(words)
        
        # If content fits in a single chunk
        if len(text_content) <= max_size:
            return [f"Section: {context_header}\nContent: {text_content}"]
            
        # Segment into overlapping blocks
        start = 0
        while start < len(text_content):
            end = start + max_size
            chunk_slice = text_content[start:end]
            
            # Prepend context header so embeddings retain topical association
            chunks.append(f"Section: {context_header}\nContent: {chunk_slice}")
            
            start += (max_size - overlap)
            
        return chunks

    # ==========================================
    # Embedding & Ingestion Core
    # ==========================================

    async def add_articles(self, articles: List[Dict[str, Any]]):
        """Parses article contents into chunks, vectorizes them, and adds them to FAISS."""
        vectors = []
        new_chunk_ids = []
        
        for art in articles:
            article_id = art["id"]
            title = art["title"]
            content = art["content"]
            source_type = art.get("source_type", "markdown")
            effectiveness_score = art.get("effectiveness_score", 0.0)
            
            # Step 1: Document parser chunk routing (Markdown only)
            raw_chunks = self.parse_markdown_chunks(content)
                
            # Step 2: Compute vector embedding for each chunk
            for idx, chunk_text in enumerate(raw_chunks):
                chunk_id = f"{article_id}_chunk_{idx}"
                
                # We prepend the article title to build clean embedding associations
                contextual_text = f"Article Title: {title}\n{chunk_text}"
                embedding = await ollama_client.generate_embeddings(contextual_text)
                
                # Normalize vector to unit length (Cosine similarity requires normalized inner product)
                vector = np.array(embedding, dtype=np.float32)
                norm = np.linalg.norm(vector)
                if norm > 0:
                    vector = vector / norm
                    
                vectors.append(vector)
                new_chunk_ids.append(chunk_id)
                
                # Save chunk metadata for search mappings
                self.chunks_metadata[chunk_id] = {
                    "chunk_id": chunk_id,
                    "article_id": article_id,
                    "title": title,
                    "chunk_content": chunk_text,
                    "source_type": source_type,
                    "effectiveness_score": effectiveness_score
                }
                
        if vectors:
            vector_matrix = np.vstack(vectors)
            self.index.add(vector_matrix)
            self.id_map.extend(new_chunk_ids)
            self.save_index()

    # ==========================================
    # Semantic Similarity Search
    # ==========================================

    async def search(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """Performs semantic cosine similarity matching query vectors against FAISS index."""
        if self.index.ntotal == 0:
            return []
            
        # Step 1: Embed search query
        query_embedding = await ollama_client.generate_embeddings(query)
        q_vector = np.array(query_embedding, dtype=np.float32).reshape(1, -1)
        
        # Step 2: Normalize query vector
        norm = np.linalg.norm(q_vector)
        if norm > 0:
            q_vector = q_vector / norm
            
        # Step 3: Execute lookup search in FAISS Index
        # Search returns distances/similarity scores and row indices
        scores, indices = self.index.search(q_vector, min(top_k, self.index.ntotal))
        
        results = []
        seen_articles = set() # Avoid returning duplicate chunks of the same article if top_k is large
        
        for score, idx in zip(scores[0], indices[0]):
            if idx == -1 or idx >= len(self.id_map):
                continue
                
            chunk_id = self.id_map[idx]
            meta = self.chunks_metadata.get(chunk_id)
            
            if meta:
                article_id = meta["article_id"]
                if article_id in seen_articles:
                    continue
                seen_articles.add(article_id)
                
                results.append({
                    "id": article_id,
                    "chunk_id": chunk_id,
                    "title": meta["title"],
                    "content": meta["chunk_content"],
                    "source_type": meta["source_type"],
                    "effectiveness_score": meta["effectiveness_score"],
                    "score": float(score)  # Cosine similarity score representation
                })
                
        return results

    async def get_article_by_id(self, article_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves full article details by merging its chunk contents."""
        matched_chunks = []
        article_title = ""
        source_type = "manual"
        effectiveness_score = 0.0
        
        # Collect chunks belonging to the article
        for cid, meta in self.chunks_metadata.items():
            if meta["article_id"] == article_id:
                matched_chunks.append(meta)
                if not article_title:
                    article_title = meta["title"]
                    source_type = meta["source_type"]
                    effectiveness_score = meta["effectiveness_score"]
                    
        if not matched_chunks:
            return None
            
        # Sort chunks to preserve original flow
        # chunk IDs are in format {article_id}_chunk_{index}
        try:
            matched_chunks.sort(key=lambda x: int(x["chunk_id"].split("_")[-1]))
        except Exception:
            pass
            
        merged_content = "\n\n".join([chunk["chunk_content"] for chunk in matched_chunks])
        
        return {
            "id": article_id,
            "title": article_title,
            "content": merged_content,
            "source_type": source_type,
            "effectiveness_score": effectiveness_score
        }

# Singleton instance
rag_engine = RAGEngine()
