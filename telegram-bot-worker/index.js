/**
 * Cloudflare Worker for Telegram Bot using grammY
 */

import { Bot, webhookCallback } from 'grammy';

const WEB_APP_URL = 'https://arkanoid-worker.ewesttt.workers.dev';

async function handleRequest(request, env) {
  const bot = new Bot(env.TELEGRAM_BOT_TOKEN);

  bot.command('start', async (ctx) => {
    await ctx.reply('Добро пожаловать в Neon Arkanoid! 🎮\n\nИспользуй мышку или стрелки для управления.', {
      reply_markup: {
        inline_keyboard: [[
          { text: '🎮 Играть в Arkanoid', web_app: { url: WEB_APP_URL } }
        ]]
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

  const handleUpdate = webhookCallback(bot, 'cloudflare-mod');

  try {
    await handleUpdate(request);
    return new Response('ok');
  } catch (error) {
    console.error('Error handling update:', error);
    return new Response('error', { status: 500 });
  }
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'POST') {
      return handleRequest(request, env);
    }
    return new Response('Method not allowed', { status: 405 });
  },
};