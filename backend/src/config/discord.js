const { Client, GatewayIntentBits } = require('discord.js');
const logger = require('../utils/logger');

let client = null;

if (process.env.DISCORD_TOKEN && process.env.DISCORD_TOKEN !== 'your_discord_bot_token_here') {
  try {
    client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent
      ]
    });

    client.on('error', (err) => {
      logger.error('Discord client error: %s', err.message);
    });
  } catch (err) {
    logger.error('Failed to initialize Discord client: %s', err.message);
    client = null;
  }
} else {
  logger.warn('DISCORD_TOKEN not provided in .env. Discord integration will run in mock mode.');
}

module.exports = client;
