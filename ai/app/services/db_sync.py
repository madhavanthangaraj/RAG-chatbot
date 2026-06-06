import sqlite3
from typing import List, Dict, Any
from ..config import settings
from .rag_engine import rag_engine

class DatabaseSyncService:
    def __init__(self):
        self.db_path = settings.SQLITE_DB_PATH

    def _get_connection(self):
        """Creates a connection to the SQLite database."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    async def synchronize_kb_articles(self) -> int:
        """Pulls articles from sqlite database, embeds them, and updates the RAG store."""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            # Fetch all articles from table
            cursor.execute("SELECT id, title, content, source_type, effectiveness_score FROM kb_articles")
            rows = cursor.fetchall()
            
            articles: List[Dict[str, Any]] = []
            for row in rows:
                articles.append({
                    "id": row["id"],
                    "title": row["title"],
                    "content": row["content"],
                    "source_type": row["source_type"],
                    "effectiveness_score": row["effectiveness_score"]
                })
                
            if articles:
                # Re-initialize/add articles to semantic FAISS index
                # For high performance, we clear and rebuild or add incrementally.
                # Rebuilding is extremely safe for L0 databases to prevent duplicates.
                rag_engine._create_fresh_index()
                await rag_engine.add_articles(articles)
                
            return len(articles)
        finally:
            cursor.close()
            conn.close()

# Singleton instance
db_sync_service = DatabaseSyncService()
