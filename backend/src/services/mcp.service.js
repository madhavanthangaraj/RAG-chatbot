const mcpConfig = require('../config/mcp');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

class McpService {
  async agentQuery(userId, query) {
    const url = `${mcpConfig.aiServiceUrl}/api/agent/query`;
    logger.info(`Forwarding query to AI Service Agent Loop: ${url}`);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, query })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AppError(errorData.detail || 'AI Service returned an error', response.status);
      }

      return await response.json();
    } catch (err) {
      logger.error('AI Service connection failed: %s', err.message);
      throw new AppError('AI Service unreachable. Falling back to local RAG.', 503);
    }
  }

  async callTool(toolName, args) {
    const url = `${mcpConfig.aiServiceUrl}/mcp/tools/execute`;
    logger.info(`Executing MCP Tool via AI Service: ${url} | Tool: ${toolName}`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: toolName, arguments: args })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AppError(errorData.detail || 'MCP Tool execution failed', response.status);
      }

      return await response.json();
    } catch (err) {
      logger.error('MCP Tool execution failed connection: %s', err.message);
      throw new AppError('MCP Server unreachable.', 503);
    }
  }
}

module.exports = new McpService();
