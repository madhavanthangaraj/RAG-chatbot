from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .models.schemas import (
    AgentQueryRequest, AgentQueryResponse,
    ToolExecuteRequest, ToolExecuteResponse,
    TicketAnalyzeRequest, TicketAnalyzeResponse
)
from .core.agent import react_agent
from .core.mcp_server import mcp_server
from .services.db_sync import db_sync_service
from .services.ollama_client import ollama_client


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Python AI Service providing FAISS RAG, ReAct Agent Loops, and MCP interfaces"
)

# Enable CORS for external connections (like Node backend server)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Startup hook to run SQLite-to-FAISS RAG sync indexing."""
    print("AI Service running. Performing initial SQLite database KB sync...")
    try:
        count = await db_sync_service.synchronize_kb_articles()
        print(f"RAG Sync Complete. Embeddings generated for {count} knowledge articles.")
    except Exception as e:
        print(f"WARNING: SQLite initial RAG sync failed on startup: {str(e)}")


@app.post(
    "/api/agent/query",
    response_model=AgentQueryResponse,
    status_code=status.HTTP_200_OK,
    summary="Agent Query Loop Endpoint"
)
async def query_agent(request: AgentQueryRequest):
    """Triggers the ReAct Agent loop to resolve the user support question."""
    try:
        result = await react_agent.execute(query=request.query, user_id=request.userId)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Agent loop failure: {str(e)}"
        )


@app.post(
    "/api/kb/sync",
    status_code=status.HTTP_200_OK,
    summary="Synchronize SQLite articles to FAISS index"
)
async def sync_vector_db():
    """Manual trigger endpoint to sync SQLite changes into FAISS embeddings index."""
    try:
        count = await db_sync_service.synchronize_kb_articles()
        return {"status": "success", "message": f"Successfully synchronized and vectorized {count} articles."}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database RAG sync failed: {str(e)}"
        )


# ==========================================
# Model Context Protocol (MCP) Interface
# ==========================================

@app.get(
    "/mcp/tools",
    status_code=status.HTTP_200_OK,
    summary="List MCP Tools"
)
async def list_mcp_tools():
    """Returns schemas and parameter specifications for all registered MCP tools."""
    try:
        tools = mcp_server.get_tool_list()
        return {"tools": tools}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list MCP tools: {str(e)}"
        )


@app.post(
    "/mcp/tools/execute",
    status_code=status.HTTP_200_OK,
    summary="Execute MCP Tool"
)
async def execute_mcp_tool(request: ToolExecuteRequest):
    """Executes a specific tool by name with provided arguments from external MCP clients."""
    try:
        result = await mcp_server.execute_tool(name=request.name, arguments=request.arguments)
        if result.get("isError"):
            return ToolExecuteResponse(
                status="error",
                message=result["content"][0]["text"]
            )
        return ToolExecuteResponse(
            status="success",
            output=result["content"][0]["text"]
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"MCP Tool execution failed: {str(e)}"
        )


@app.post(
    "/api/tickets/analyze",
    response_model=TicketAnalyzeResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate Root Cause Analysis suggestion"
)
async def analyze_ticket_root_cause(request: TicketAnalyzeRequest):
    """Diagnoses root cause suggestion based on support ticket logs."""
    try:
        diagnosis = await ollama_client.analyze_root_cause(
            subject=request.subject,
            description=request.description
        )
        return TicketAnalyzeResponse(rootCauseSuggestion=diagnosis)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Diagnostics analysis failed: {str(e)}"
        )


@app.get("/health", status_code=status.HTTP_200_OK)
def health_check():
    return {"status": "healthy", "service": settings.APP_NAME}

