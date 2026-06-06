from pydantic import BaseModel, Field
from typing import Optional
from .base import registry
import httpx
from ..config import settings

class CreateTicketInput(BaseModel):
    user_id: Optional[str] = Field(None, description="Owner of the ticket")
    subject: str = Field(..., description="Subject summary of the customer support ticket")
    description: str = Field(..., description="Full descriptive issue summary details")
    priority: str = Field("medium", description="Priority level: low, medium, high, urgent")
    category: str = Field("general", description="Category for ticket grouping")

class UpdateTicketInput(BaseModel):
    ticket_id: str = Field(..., description="Unique ID of the ticket to modify")
    status: Optional[str] = Field(None, description="Status update: open, in_progress, resolved, closed")
    priority: Optional[str] = Field(None, description="Priority update: low, medium, high, urgent")
    assigned_to: Optional[str] = Field(None, description="User ID of the assigned staff support agent")

class GetTicketStatusInput(BaseModel):
    ticket_id: str = Field(..., description="Unique ID of the ticket to fetch details for")


@registry.register(
    name="create_ticket",
    description="Manually logs a new customer support ticket to escalate an issue.",
    input_model=CreateTicketInput
)
async def create_ticket(args: CreateTicketInput):
    url = "http://localhost:5000/api/tickets"
    payload = args.model_dump(exclude_none=True)
    
    headers = {
        "X-System-Key": settings.JWT_SECRET
    }
    if args.user_id:
        headers["X-User-Id"] = args.user_id

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload, headers=headers, timeout=5.0)
            if response.status_code == 201:
                return response.json()
            return {"status": "error", "message": f"Backend returned status {response.status_code}: {response.text}"}
        except Exception as e:
            return {"status": "error", "message": f"Connection error to backend: {str(e)}"}


@registry.register(
    name="update_ticket",
    description="Updates fields like status, priority, or assignee for a customer support ticket.",
    input_model=UpdateTicketInput
)
async def update_ticket(args: UpdateTicketInput):
    url = f"http://localhost:5000/api/tickets/{args.ticket_id}"
    payload = args.model_dump(exclude_none=True)
    payload.pop("ticket_id", None)
    
    headers = {
        "X-System-Key": settings.JWT_SECRET
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.put(url, json=payload, headers=headers, timeout=5.0)
            if response.status_code == 200:
                return response.json()
            return {"status": "error", "message": f"Backend returned status {response.status_code}: {response.text}"}
        except Exception as e:
            return {"status": "error", "message": f"Connection error to backend: {str(e)}"}


@registry.register(
    name="get_ticket_status",
    description="Queries the status and assignment details of a support ticket.",
    input_model=GetTicketStatusInput
)
async def get_ticket_status(args: GetTicketStatusInput):
    url = f"http://localhost:5000/api/tickets/{args.ticket_id}"
    
    headers = {
        "X-System-Key": settings.JWT_SECRET
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers, timeout=5.0)
            if response.status_code == 200:
                return response.json()
            return {"status": "error", "message": f"Backend returned status {response.status_code}: {response.text}"}
        except Exception as e:
            return {"status": "error", "message": f"Connection error to backend: {str(e)}"}
