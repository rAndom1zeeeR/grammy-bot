import type { MyContext } from '../../types/index.js';
import { logger } from '../../utils/logger.js';

export const helpCommand = async (ctx: MyContext) => {
  if (!ctx.from) {
    return ctx.reply('Информация о пользователе недоступна');
  }

  try {
    const helpMessage = `🤖 Доступные команды:\n\n` +
      `🚀 /start - Начать работу с ботом\n` +
      `📊 /stats - Показать статистику бота\n` +
      `❓ /help - Показать это сообщение\n\n` +
      `💡 Просто отправьте любое текстовое сообщение, и бот повторит его!`;

    await ctx.reply(helpMessage);

    logger.info('Help command executed', {
      telegramId: ctx.from.id,
      username: ctx.from.username,
    });

  } catch (error) {
    logger.error('Help command error', {
      error: error instanceof Error ? error.message : String(error),
      telegramId: ctx.from.id,
      username: ctx.from.username,
    });
    await ctx.reply('Произошла ошибка при получении справки');
  }
};
