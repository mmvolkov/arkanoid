/**
 * Cloudflare Worker for Telegram Bot using grammY
 */

const { Bot, webhookCallback } = require('grammy');
const WEB_APP_URL = 'https://arkanoid-worker.ewesttt.workers.dev';

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);

bot.command('start', async (ctx) => {
  await ctx.reply('Добро пожаловать в Neon Arkanoid! 🎮\n\nИспользуй мышку или стрелки для управления.', {
    reply_markup: {
      web_app: { url: WEB_APP_URL }
    }
  });
});

bot.command('help', async (ctx) => {
  await ctx.reply(
    '🕹 Neon Arkanoid\n\n' +
    'Управление:\n' +
    '• Мышь — двигай ракетку\n' +
    '• Стрелки / A,D — двигай ракетку\n' +
    '• Пробел / Клик — запустить шарик\n\n' +
    'Разбей все кирпичи!'
  );
});

bot.on('web_app_data', async (ctx) => {
  // Handle data from web app if needed
  console.log('Web app data received:', ctx.message.web_app_data);
});

const handleUpdate = webhookCallback(bot, 'cloudflare-mod');

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'POST') {
      try {
        await handleUpdate(request);
        return new Response('ok');
      } catch (error) {
        console.error('Error handling update:', error);
        return new Response('error', { status: 500 });
      }
    }
    return new Response('Method not allowed', { status: 405 });
  },
};