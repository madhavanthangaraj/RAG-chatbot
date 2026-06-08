import sys
import os
import unittest
from unittest.mock import MagicMock

# Setup Python paths to resolve relative imports
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, ROOT_DIR)
sys.path.insert(0, os.path.join(ROOT_DIR, 'ai'))

# Mock services to avoid database/network/FAISS calls during unit tests
sys.modules['ai.app.services.ollama_client'] = MagicMock()
mock_rag_engine = MagicMock()
sys.modules['ai.app.services.rag_engine'] = MagicMock()
sys.modules['ai.app.services.rag_engine'].rag_engine = mock_rag_engine

from ai.app.core.agent import RAGAgent

class TestAIHappyPath(unittest.TestCase):
    def setUp(self):
        self.agent = RAGAgent()

    def test_levenshtein_distance(self):
        # Happy path edit distance checks
        self.assertEqual(self.agent._levenshtein_distance("feedback", "feesback"), 1)
        self.assertEqual(self.agent._levenshtein_distance("password", "passward"), 1)
        self.assertEqual(self.agent._levenshtein_distance("outage", "outages"), 1)
        self.assertEqual(self.agent._levenshtein_distance("fees", "fees"), 0)
        self.assertEqual(self.agent._levenshtein_distance("", "abc"), 3)

    def test_is_fuzzy_match(self):
        # Short words under 4 chars should not allow fuzzy matching
        self.assertFalse(self.agent._is_fuzzy_match("are", "fee"))
        self.assertFalse(self.agent._is_fuzzy_match("abc", "abd"))
        
        # Valid edit distance checks
        self.assertTrue(self.agent._is_fuzzy_match("password", "passward"))
        self.assertTrue(self.agent._is_fuzzy_match("feedback", "feesback"))
        
        # More than allowed edit distance should fail
        self.assertFalse(self.agent._is_fuzzy_match("password", "psw"))

    def test_spelling_corrector(self):
        # Set up mock metadata vocab in RAG engine
        mock_rag_engine.chunks_metadata = {
            "chunk1": {"title": "Reset Student Password"},
            "chunk2": {"title": "Submitting Feedback & Suggestions"},
            "chunk3": {"title": "Instructions to Pay Student Fees"}
        }

        # Query with spelling mistakes
        query_with_typo = "how to reset my passward and give feesback"
        corrected_query = self.agent._correct_query_spelling(query_with_typo)
        
        self.assertIn("password", corrected_query.lower())
        self.assertIn("feedback", corrected_query.lower())
        # Stopwords and valid terms shouldn't get corrupted
        self.assertIn("reset", corrected_query.lower())

if __name__ == '__main__':
    unittest.main()
