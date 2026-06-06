const analyticsService = require('../services/analytics.service');

class AnalyticsController {
  async getDashboardMetrics(req, res, next) {
    try {
      const data = await analyticsService.getDashboardData();
      res.status(200).json({
        status: 'success',
        data
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AnalyticsController();
