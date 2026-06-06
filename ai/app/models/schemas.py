from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional

# RAG & Agent schemas
class AgentQueryRequest(BaseModel):
    userId: str = Field(..., description="ID of the user sending the message")
    query: str = Field(..., description="The query string / question asked by the user")

class CitationSchema(BaseModel):
    article_id: str
    title: str
    snippet: str

class AgentQueryResponse(BaseModel):
    reply: str = Field(..., description="Constructed response text from agent execution")
    confidenceScore: float = Field(..., description="Agent confidence score (0.0 to 1.0)")
    citations: List[CitationSchema] = Field(default_factory=list, description="Referenced article resources")
    suggestedFollowups: List[str] = Field(default_factory=list, description="💡 Suggested follow-up questions")
    escalated: bool = Field(default=False, description="Flag indicating if the query was escalated")
    ticketId: Optional[str] = Field(default=None, description="Logged ticket ID if query was escalated")

# MCP schemas
class ToolExecuteRequest(BaseModel):
    name: str = Field(..., description="Name of the tool to execute")
    arguments: Dict[str, Any] = Field(default_factory=dict, description="Input arguments for the tool")

class ToolExecuteResponse(BaseModel):
    status: str = Field(..., description="Success or error status")
    output: Any = Field(None, description="Result output of the tool execution")
    message: Optional[str] = Field(None, description="Status description message")

# Root Cause Analysis schemas
class TicketAnalyzeRequest(BaseModel):
    subject: str = Field(..., description="Subject text of the escalated ticket")
    description: str = Field(..., description="Detailed description/log outputs of the error")

class TicketAnalyzeResponse(BaseModel):
    rootCauseSuggestion: str = Field(..., description="AI generated root cause diagnosis summary")

