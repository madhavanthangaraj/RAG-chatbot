const discordClient = require('../config/discord');
const chatService = require('./chat.service');
const ticketService = require('./ticket.service');
const userRepository = require('../repositories/user.repository');
const analyticsService = require('./analytics.service');
const logger = require('../utils/logger');

class DiscordService {
  async startListener() {
    if (!discordClient) {
      logger.warn('Discord Bot client is not initialized (missing token). Listener skipped.');
      return;
    }

    discordClient.once('ready', () => {
      logger.info(`Discord Bot logged in as ${discordClient.user.tag}!`);
      this.registerSlashCommands();
    });

    discordClient.on('messageCreate', async (message) => {
      if (message.author.bot) return;

      const content = message.content.trim();

      try {
        const discordUser = await this.getOrCreateDiscordUser(message.author);

        if (content.startsWith('!ticket')) {
          await this.handleManualTicketCommand(message, content, discordUser);
          return;
        }

        const isDM = !message.guild;
        const isMentioned = message.mentions.has(discordClient.user);

        if (isDM || isMentioned) {
          const query = content.replace(`<@!${discordClient.user.id}>`, '').replace(`<@${discordClient.user.id}>`, '').trim();
          if (query.length === 0) {
            await message.reply('Hello! How can I help you today? Ask me any question about our services.');
            return;
          }

          await this.handleQuestionQuery(message, query, discordUser);
        }
      } catch (err) {
        logger.error('Error handling Discord message: %s', err.message);
        await message.reply('Sorry, an error occurred while processing your request.');
      }
    });

    try {
      await discordClient.login(process.env.DISCORD_TOKEN);
    } catch (err) {
      logger.error('Failed to log in Discord bot: %s', err.message);
    }
  }

  async getOrCreateDiscordUser(author) {
    const email = `${author.id}@discord.com`;
    let user = await userRepository.findByEmail(email);
    if (!user) {
      user = await userRepository.createUser({
        username: `discord_${author.username}`,
        email,
        passwordHash: 'discord_auth_external_bypass',
        role: 'user'
      });
    }
    return user;
  }

  async handleManualTicketCommand(message, content, user) {
    const rawArgs = content.substring(7).trim();
    const parts = rawArgs.split('|').map(p => p.trim());

    if (parts.length < 2 || parts[0] === '' || parts[1] === '') {
      await message.reply('To log a support ticket, use: `!ticket Subject | Description`');
      return;
    }

    const [subject, description] = parts;
    const ticket = await ticketService.createTicket({
      userId: user.id,
      subject,
      description,
      escalated: false
    });

    await message.reply(`✅ Ticket created successfully! **ID:** \`${ticket.id}\` | **Status:** \`${ticket.status}\` | **Priority:** \`${ticket.priority}\`.`);
  }

  async handleQuestionQuery(message, query, user) {
    if (message.channel.sendTyping) await message.channel.sendTyping();

    const response = await chatService.processMessage(user.id, query);
    const confidenceThreshold = parseFloat(process.env.CONFIDENCE_THRESHOLD || '0.75');
    
    if (response.confidenceScore < confidenceThreshold) {
      const ticket = await ticketService.createTicket({
        userId: user.id,
        subject: `Discord auto-escalation: ${query.substring(0, 40)}...`,
        description: `User asked: "${query}". AI responded with low confidence (${response.confidenceScore}): "${response.reply}"`,
        escalated: true,
        escalationReason: `Discord low confidence threshold search (${response.confidenceScore} < ${confidenceThreshold})`
      });

      await analyticsService.logEvent({
        eventType: 'search_fail',
        query,
        userId: user.id
      });

      await analyticsService.logEvent({
        eventType: 'ticket_escalation',
        query,
        userId: user.id
      });

      await message.reply(
        `I'm sorry, I'm not confident enough in answering that question. 🧑‍💻 I have automatically escalated this issue to our support team.\n` +
        `**Ticket logged:** \`${ticket.id}\` | **Priority:** \`${ticket.priority}\`\nAn agent will follow up with you shortly.`
      );
    } else {
      let replyText = response.reply;
      
      if (response.citations && response.citations.length > 0) {
        replyText += '\n\n**Citations:**';
        response.citations.forEach((cit, idx) => {
          replyText += `\n[${idx + 1}] *${cit.title}*`;
        });
      }

      const firstCitationId = response.citations && response.citations.length > 0 ? response.citations[0].article_id : null;
      await analyticsService.logEvent({
        eventType: 'search_success',
        query,
        resolvedArticleId: firstCitationId,
        userId: user.id
      });

      await message.reply(replyText);
    }
  }

  async registerSlashCommands() {
    logger.info('Registering slash commands...');
  }
}

module.exports = new DiscordService();
