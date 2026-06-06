const express = require('express');
const multer = require('multer');
const router = express.Router();
const kbController = require('../controllers/kb.controller');
const validate = require('../middlewares/validate.middleware');
const { protect, restrictTo } = require('../middlewares/auth.middleware');
const { createArticleSchema, updateArticleSchema, rollbackSchema } = require('../validators/kb.validator');

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Search and List - Public
router.get('/search', kbController.searchArticles);
router.get('/articles', kbController.listArticles);
router.get('/articles/:id', kbController.getArticle);

// Management routes - Protected
router.use(protect);

router.post(
  '/sync',
  restrictTo('admin', 'support_agent'),
  upload.single('file'),
  kbController.syncArticles
);

router.post(
  '/articles',
  restrictTo('admin', 'support_agent'),
  validate(createArticleSchema),
  kbController.createArticle
);

router.put(
  '/articles/:id',
  restrictTo('admin', 'support_agent'),
  validate(updateArticleSchema),
  kbController.updateArticle
);

router.delete(
  '/articles/:id',
  restrictTo('admin'),
  kbController.deleteArticle
);

router.get(
  '/articles/:id/versions',
  restrictTo('admin', 'support_agent'),
  kbController.getVersions
);

router.post(
  '/articles/:id/rollback',
  restrictTo('admin', 'support_agent'),
  validate(rollbackSchema),
  kbController.rollbackVersion
);

module.exports = router;
