const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "L0 Self-Service Knowledge Base Chatbot API",
    version: "1.0.0",
    description: "API documentation for L0 Knowledge Base Chatbot system including RAG Chatbot, Ticket Management, and Analytics."
  },
  servers: [
    {
      url: "http://localhost:5000/api",
      description: "Development Server"
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    }
  },
  paths: {
    "/auth/register": {
      post: {
        summary: "Register a new user",
        tags: ["Authentication"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  username: { type: "string", example: "johndoe" },
                  email: { type: "string", example: "john@example.com" },
                  password: { type: "string", example: "password123" },
                  role: { type: "string", enum: ["user", "support_agent", "admin"], example: "user" }
                },
                required: ["username", "email", "password"]
              }
            }
          }
        },
        responses: {
          201: { description: "Successful registration" }
        }
      }
    },
    "/auth/login": {
      post: {
        summary: "Login and receive JWT tokens",
        tags: ["Authentication"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string", example: "john@example.com" },
                  password: { type: "string", example: "password123" }
                },
                required: ["email", "password"]
              }
            }
          }
        },
        responses: {
          200: { description: "Login successful" }
        }
      }
    },
    "/kb/articles": {
      get: {
        summary: "List all knowledge base articles",
        tags: ["Knowledge Base"],
        responses: {
          200: { description: "Successful operation" }
        }
      },
      post: {
        summary: "Create a new article manually",
        tags: ["Knowledge Base"],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string", example: "How to configure API" },
                  content: { type: "string", example: "To set up, navigate to keys and add new token..." }
                },
                required: ["title", "content"]
              }
            }
          }
        },
        responses: {
          201: { description: "Article created" }
        }
      }
    },
    "/tickets": {
      post: {
        summary: "Create a support ticket",
        tags: ["Ticket Management"],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  subject: { type: "string", example: "Database crash on startup" },
                  description: { type: "string", example: "The server returns sqlite database lock timeouts." }
                },
                required: ["subject", "description"]
              }
            }
          }
        },
        responses: {
          201: { description: "Ticket created" }
        }
      }
    }
  }
};

module.exports = swaggerDocument;
