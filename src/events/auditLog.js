// Audit log aggregator for all important events
const { readGuildLogs } = require('../../utils/jsondb');

module.exports = {
  name: 'auditLog',
  async getAuditLog(guildId, limit = 100) {
    // Fetch and sort logs by date desc
    const logs = await readGuildLogs(guildId);
    return logs.sort((a, b) => (b.date || 0) - (a.date || 0)).slice(0, limit);
  }
};
