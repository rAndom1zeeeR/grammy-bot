import type { MyContext } from '../../types/index.js';
import { UserService } from '../../services/user.service.js';
import { logger } from '../../utils/logger.js';

export const statsCommand = async (ctx: MyContext) => {
  if (!ctx.from) {
    return ctx.reply('Информация о пользователе недоступна');
  }

  try {
    const totalUsers = await UserService.getUsersCount();
    const newUsersToday = await UserService.getNewUsersToday();

    const statsMessage = `📊 Статистика бота:\n\n` +
      `👥 Всего пользователей: ${totalUsers}\n` +
      `🆕 Новых сегодня: ${newUsersToday}\n\n` +
      `ℹ️ Ваш Telegram ID: ${ctx.from.id}`;

    await ctx.reply(statsMessage);

    logger.info('Stats command executed', {
      telegramId: ctx.from.id,
      username: ctx.from.username,
      totalUsers,
      newUsersToday,
    });

  } catch (error) {
    logger.error('Stats command error', {
      error: error instanceof Error ? error.message : String(error),
      telegramId: ctx.from.id,
      username: ctx.from.username,
    });
    await ctx.reply('Произошла ошибка при получении статистики');
  }
};
