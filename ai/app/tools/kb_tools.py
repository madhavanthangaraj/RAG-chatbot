from pydantic import BaseModel, Field
from .base import registry
from ..services.rag_engine import rag_engine

class KBSearchInput(BaseModel):
    query: str = Field(..., description="The query string/keywords to search inside the Knowledge Base")
    top_k: int = Field(default=3, description="Maximum number of relevant articles to return")

class KBRetrieveInput(BaseModel):
    article_id: str = Field(..., description="Unique ID of the article to retrieve complete contents for")


@registry.register(
    name="search_kb",
    description="Search the local vector database for matching articles in the Knowledge Base.",
    input_model=KBSearchInput
)
async def search_kb(args: KBSearchInput):
    results = await rag_engine.search(query=args.query, top_k=args.top_k)
    return results


@registry.register(
    name="search_articles",
    description="Query the Knowledge Base articles database semantically for matching documentation.",
    input_model=KBSearchInput
)
async def search_articles(args: KBSearchInput):
    """MCP tool for searching articles in the vector store."""
    results = await rag_engine.search(query=args.query, top_k=args.top_k)
    return results


@registry.register(
    name="retrieve_article",
    description="Retrieve the complete content text of a specific Knowledge Base article by its ID.",
    input_model=KBRetrieveInput
)
async def retrieve_article(args: KBRetrieveInput):
    article = await rag_engine.get_article_by_id(args.article_id)
    if not article:
        return {"status": "error", "message": f"Article with ID {args.article_id} not found."}
    return article
