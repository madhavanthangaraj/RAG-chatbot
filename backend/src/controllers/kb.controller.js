const kbService = require('../services/kb.service');

class KbController {
  async syncArticles(req, res, next) {
    try {
      const result = await kbService.processFileUpload({
        file: req.file,
        userId: req.user ? req.user.id : null
      });
      res.status(201).json({
        status: 'success',
        results: result.length,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async listArticles(req, res, next) {
    try {
      const articles = await kbService.listArticles();
      res.status(200).json({
        status: 'success',
        results: articles.length,
        data: articles
      });
    } catch (err) {
      next(err);
    }
  }

  async getArticle(req, res, next) {
    try {
      const article = await kbService.getArticle(req.params.id);
      res.status(200).json({
        status: 'success',
        data: article
      });
    } catch (err) {
      next(err);
    }
  }

  async createArticle(req, res, next) {
    try {
      const { title, content } = req.body;
      const article = await kbService.createArticle({
        title,
        content,
        sourceType: 'markdown',
        userId: req.user ? req.user.id : null
      });
      res.status(201).json({
        status: 'success',
        data: article
      });
    } catch (err) {
      next(err);
    }
  }

  async updateArticle(req, res, next) {
    try {
      const { title, content } = req.body;
      const article = await kbService.updateArticle(req.params.id, {
        title,
        content,
        userId: req.user ? req.user.id : null
      });
      res.status(200).json({
        status: 'success',
        data: article
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteArticle(req, res, next) {
    try {
      await kbService.deleteArticle(req.params.id);
      res.status(204).json({
        status: 'success',
        data: null
      });
    } catch (err) {
      next(err);
    }
  }

  async getVersions(req, res, next) {
    try {
      const history = await kbService.getVersions(req.params.id);
      res.status(200).json({
        status: 'success',
        results: history.length,
        data: history
      });
    } catch (err) {
      next(err);
    }
  }

  async rollbackVersion(req, res, next) {
    try {
      const { version } = req.body;
      const article = await kbService.rollbackVersion(req.params.id, parseInt(version, 10), req.user ? req.user.id : null);
      res.status(200).json({
        status: 'success',
        data: article
      });
    } catch (err) {
      next(err);
    }
  }

  async searchArticles(req, res, next) {
    try {
      const results = await kbService.search(req.query.q);
      res.status(200).json({
        status: 'success',
        results: results.length,
        data: results
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new KbController();
