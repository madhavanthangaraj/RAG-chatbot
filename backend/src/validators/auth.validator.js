const { z } = require('zod');

const registerSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['admin', 'user', 'support_agent']).optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

const refreshSchema = z.object({
  refreshToken: z.string()
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema
};
