const { z } = require('zod');

const createArticleSchema = z.object({
  title: z.string().min(3).max(150),
  content: z.string().min(10)
});

const updateArticleSchema = z.object({
  title: z.string().min(3).max(150),
  content: z.string().min(10)
});

const rollbackSchema = z.object({
  version: z.union([z.number(), z.string()]).transform((val) => {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed)) throw new Error('Version must be a valid integer');
    return parsed;
  })
});

module.exports = {
  createArticleSchema,
  updateArticleSchema,
  rollbackSchema
};
