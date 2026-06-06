from typing import Dict, Any, List
from ..tools.base import registry

class MCPServer:
    def __init__(self):
        # Imports tools modules to trigger registry decorators
        from ..tools import kb_tools, ticket_tools, discord_tools, analytics_tools


    def get_tool_list(self) -> List[Dict[str, Any]]:
        """Compiles standard MCP schema tool definitions."""
        schemas = registry.list_tools()
        tools = []
        for name, info in schemas.items():
            tools.append({
                "name": name,
                "description": info["description"],
                "inputSchema": info["input_schema"]
            })
        return tools

    async def execute_tool(self, name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Looks up registered MCP tools and executes them, returning formatted outputs."""
        tool = registry.get_tool(name)
        if not tool:
            return {
                "isError": True,
                "content": [{"type": "text", "text": f"Error: Tool '{name}' not found."}]
            }

        try:
            result = await tool.execute(arguments)
            return {
                "isError": False,
                "content": [{"type": "text", "text": str(result)}]
            }
        except Exception as e:
            return {
                "isError": True,
                "content": [{"type": "text", "text": f"Execution failed: {str(e)}"}]
            }

# Singleton instance
mcp_server = MCPServer()
