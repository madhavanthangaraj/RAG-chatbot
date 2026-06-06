import httpx
from typing import List, Dict, Any, Optional
from ..config import settings

class OllamaClient:
    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL
        self.chat_model = settings.OLLAMA_CHAT_MODEL
        self.embed_model = settings.OLLAMA_EMBED_MODEL

    async def generate_chat_completion(
        self, 
        messages: List[Dict[str, str]], 
        tools: Optional[List[Dict[str, Any]]] = None,
        temperature: float = 0.2
    ) -> Dict[str, Any]:
        """Sends chat messages to Ollama and retrieves text or function-calling payloads."""
        url = f"{self.base_url}/api/chat"
        payload = {
            "model": self.chat_model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": temperature
            }
        }
        
        # If model supports tool binding, inject JSON schema
        if tools:
            payload["tools"] = tools

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, json=payload, timeout=30.0)
                if response.status_code == 200:
                    return response.json().get("message", {})
                else:
                    raise Exception(f"Ollama error status {response.status_code}")
            except Exception as e:
                raise Exception(f"Failed to connect to Ollama: {str(e)}")

    async def generate_embeddings(self, text: str) -> List[float]:
        """Calls Ollama to generate vector embeddings for text chunks."""
        url = f"{self.base_url}/api/embeddings"
        payload = {
            "model": self.embed_model,
            "prompt": text
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, json=payload, timeout=10.0)
                if response.status_code == 200:
                    return response.json().get("embedding", [])
                else:
                    raise Exception(f"Ollama embedding status error {response.status_code}")
            except Exception as e:
                return [0.0] * settings.VECTOR_DIMENSION

    # ==========================================
    # Root Cause Analysis Heuristic
    # ==========================================
    async def analyze_root_cause(self, subject: str, description: str) -> str:
        """Invokes Llama 3.2 to run a diagnostic root cause summary based on issue logs."""
        prompt = f"""You are an expert systems engineer and support diagnostics assistant.
Analyze the following customer support ticket subject and descriptions.
Identify the likely technical root cause of the error or failure, and list a suggested solution path.
Keep your analysis concise (2-3 sentences max).

Ticket Subject: {subject}
Ticket Description:
{description}

Root Cause Analysis and Suggestion:
"""
        messages = [
            {"role": "system", "content": "You provide direct, technical, and high-fidelity root cause diagnostics."},
            {"role": "user", "content": prompt}
        ]
        
        response = await self.generate_chat_completion(messages, temperature=0.3)
        return response.get("content", "Failed to diagnose root cause. Verify system logs.").strip()

# Singleton instance
ollama_client = OllamaClient()
