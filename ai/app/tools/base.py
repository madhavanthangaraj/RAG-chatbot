import inspect
from typing import Dict, Any, Callable, Type
from pydantic import BaseModel

class MCPTool:
    def __init__(self, name: str, description: str, input_model: Type[BaseModel], func: Callable):
        self.name = name
        self.description = description
        self.input_model = input_model
        self.func = func

    def get_schema(self) -> Dict[str, Any]:
        """Returns the JSON schema of the tool for LLM function-calling injection."""
        return {
            "name": self.name,
            "description": self.description,
            "input_schema": self.input_model.model_json_schema()
        }

    async def execute(self, arguments: Dict[str, Any]) -> Any:
        """Validates arguments against the input model and executes the tool function."""
        # Validate arguments using Pydantic model
        validated_args = self.input_model(**arguments)
        
        # Check if function is async
        if inspect.iscoroutinefunction(self.func):
            return await self.func(validated_args)
        else:
            return self.func(validated_args)


class ToolRegistry:
    def __init__(self):
        self._tools: Dict[str, MCPTool] = {}

    def register(self, name: str, description: str, input_model: Type[BaseModel]):
        """Decorator to register a function as an MCP tool."""
        def decorator(func: Callable):
            tool = MCPTool(name=name, description=description, input_model=input_model, func=func)
            self._tools[name] = tool
            return func
        return decorator

    def get_tool(self, name: str) -> MCPTool:
        return self._tools.get(name)

    def list_tools(self) -> Dict[str, Dict[str, Any]]:
        return {name: tool.get_schema() for name, tool in self._tools.items()}

# Global tool registry instance
registry = ToolRegistry()
