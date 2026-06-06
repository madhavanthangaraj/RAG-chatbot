const crypto = require('crypto');

// Generate SHA256 checksum of content
function calculateChecksum(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

module.exports = {
  calculateChecksum
};
