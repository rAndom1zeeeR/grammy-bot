import type { MyContext } from '../../types/index.js';
import { logger } from '../../utils/logger.js';

export const helpCommand = async (ctx: MyContext) => {
  if (!ctx.from) {
    return ctx.reply('Context info is not available');
  }

  const { id, first_name, username } = ctx.from;

  try {
    await ctx.reply('Help, ' + username + '!');

    logger.info('Help command executed', {
      telegramId: id,
      first_name,
      username,
    });
  } catch (error) {
    logger.error('Help command error', {
      error: error instanceof Error ? error.message : String(error),
      telegramId: id,
      username,
    });
    ctx.reply('Произошла ошибка, попробуйте позже');
  }
};
