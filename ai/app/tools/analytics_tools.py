from pydantic import BaseModel, Field
from typing import Optional
from .base import registry
import httpx
from ..config import settings

class GetTopArticlesInput(BaseModel):
    limit: Optional[int] = Field(default=5, description="Maximum number of top articles to retrieve")

class GetKnowledgeGapsInput(BaseModel):
    limit: Optional[int] = Field(default=5, description="Maximum number of search gaps/failed queries to retrieve")


@registry.register(
    name="get_top_articles",
    description="Retrieve the list of most viewed and helpful Knowledge Base articles.",
    input_model=GetTopArticlesInput
)
async def get_top_articles(args: GetTopArticlesInput):
    url = "http://localhost:5000/api/analytics/dashboard"
    headers = {
        "X-System-Key": settings.JWT_SECRET
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers, timeout=5.0)
            if response.status_code == 200:
                data = response.json()
                top_articles = data.get("data", {}).get("topArticles", [])
                return top_articles[:args.limit]
            return {"status": "error", "message": f"Backend returned status {response.status_code}"}
        except Exception as e:
            return {"status": "error", "message": f"Connection error to backend: {str(e)}"}


@registry.register(
    name="get_knowledge_gaps",
    description="Retrieve terms searched by users that returned zero matched results in the Knowledge Base.",
    input_model=GetKnowledgeGapsInput
)
async def get_knowledge_gaps(args: GetKnowledgeGapsInput):
    url = "http://localhost:5000/api/analytics/dashboard"
    headers = {
        "X-System-Key": settings.JWT_SECRET
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers, timeout=5.0)
            if response.status_code == 200:
                data = response.json()
                failed_searches = data.get("data", {}).get("failedSearches", [])
                return failed_searches[:args.limit]
            return {"status": "error", "message": f"Backend returned status {response.status_code}"}
        except Exception as e:
            return {"status": "error", "message": f"Connection error to backend: {str(e)}"}
