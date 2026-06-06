module.exports = {
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  mcpSseEndpoint: '/sse',
  timeoutMs: 15000
};
