const kbRepository = require('../repositories/kb.repository');
const { calculateChecksum } = require('../utils/helpers');
const { NotFoundError, BadRequestError } = require('../utils/errors');

class KbService {
  async getArticle(id) {
    const article = await kbRepository.findById(id);
    if (!article) throw new NotFoundError('Article not found');
    return article;
  }

  async listArticles() {
    return await kbRepository.listArticles();
  }

  async createArticle({ title, content, sourceType, sourcePath, userId }) {
    const checksum = calculateChecksum(content);
    const article = await kbRepository.createArticle({
      title,
      content,
      sourceType: 'markdown',
      sourcePath: sourcePath || null,
      checksum
    });

    // Save version 1
    await kbRepository.createVersion({
      articleId: article.id,
      version: 1,
      title: article.title,
      content: article.content,
      checksum,
      createdBy: userId
    });

    return article;
  }


  async updateArticle(id, { title, content, userId }) {
    const article = await kbRepository.findById(id);
    if (!article) throw new NotFoundError('Article not found');

    const checksum = calculateChecksum(content);
    // If content and title are unchanged, don't create a new version
    if (article.title === title && article.content === content) {
      return article;
    }

    const nextVersion = article.version + 1;
    
    // Update article details
    const updated = await kbRepository.updateArticle(id, {
      title,
      content,
      version: nextVersion,
      checksum
    });

    // Create a new version log
    await kbRepository.createVersion({
      articleId: id,
      version: nextVersion,
      title,
      content,
      checksum,
      createdBy: userId
    });

    return updated;
  }

  async deleteArticle(id) {
    const article = await kbRepository.findById(id);
    if (!article) throw new NotFoundError('Article not found');
    await kbRepository.deleteArticle(id);
  }

  async getVersions(id) {
    const article = await kbRepository.findById(id);
    if (!article) throw new NotFoundError('Article not found');
    return await kbRepository.getVersionHistory(id);
  }

  async rollbackVersion(id, versionNumber, userId) {
    const article = await kbRepository.findById(id);
    if (!article) throw new NotFoundError('Article not found');

    const historicalVersion = await kbRepository.findVersion(id, versionNumber);
    if (!historicalVersion) {
      throw new NotFoundError(`Version ${versionNumber} not found for this article`);
    }

    // Rollback by updating current article and logging it as a new incremented version
    return await this.updateArticle(id, {
      title: historicalVersion.title,
      content: historicalVersion.content,
      userId
    });
  }

  async search(queryText) {
    if (!queryText || queryText.trim() === '') {
      return [];
    }
    // Perform local database keyword search
    return await kbRepository.searchArticles(queryText);
  }

  async processFileUpload({ file, userId }) {
    if (!file) throw new BadRequestError('No file uploaded');

    const originalName = file.originalname;
    const contentBuffer = file.buffer.toString('utf8');
    const extension = originalName.split('.').pop().toLowerCase();
    
    let articlesImported = [];

    if (extension === 'md') {
      // Parse markdown title from first header or filename
      let title = originalName.replace(/\.md$/, '');
      const match = contentBuffer.match(/^#\s+(.+)$/m);
      if (match) {
        title = match[1].trim();
      }
      
      const article = await this.createArticle({
        title,
        content: contentBuffer,
        sourceType: 'markdown',
        sourcePath: originalName,
        userId
      });
      articlesImported.push(article);
    } 
    else {
      throw new BadRequestError('Unsupported file type. Use .md only.');
    }

    return articlesImported;
  }

}

module.exports = new KbService();
