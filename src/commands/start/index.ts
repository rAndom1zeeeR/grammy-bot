import type { MyContext } from '../../types/index.js';
import { logger } from '../../utils/logger.js';

export const startCommand = async (ctx: MyContext) => {
  if (!ctx.from) {
    return ctx.reply('User info is not availbale');
  }

  const { id, first_name, username } = ctx.from;

  try {
    await ctx.reply('Hello, ' + username + '!');

    logger.info('Start command executed', {
      telegramId: id,
      first_name,
      username,
    });
  } catch (error) {
    logger.error('Start command error', {
      error: error instanceof Error ? error.message : String(error),
      telegramId: id,
      username,
    });
    ctx.reply('Произошла ошибка, попробуйте позже');
  }
};
