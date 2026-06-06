const analyticsRepository = require('../repositories/analytics.repository');

class AnalyticsService {
  async getDashboardData() {
    const summary = await analyticsRepository.getDashboardSummary();
    const failedSearches = await analyticsRepository.getFailedSearches(10);
    const topArticles = await analyticsRepository.getTopArticles(10);
    const trendingIssues = await analyticsRepository.getTrendingIssues(5);
    const userMetrics = await analyticsRepository.getUserMetrics();

    return {
      summary,
      failedSearches,
      topArticles,
      trendingIssues,
      userMetrics
    };
  }

  async logEvent({ eventType, query, resolvedArticleId, userId }) {
    const eventId = await analyticsRepository.logEvent({
      eventType,
      query,
      resolvedArticleId,
      userId
    });

    if (eventType === 'search_success' && resolvedArticleId) {
      analyticsRepository.updateArticleEffectiveness(resolvedArticleId).catch(err => {
        // Log recalculation error silently
        console.error(`Error updating article effectiveness for ${resolvedArticleId}:`, err);
      });
    }

    return eventId;
  }
}

module.exports = new AnalyticsService();
