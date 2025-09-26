import type { MyContext } from '../../types/index.js';
import { logger } from '../../utils/logger.js';
import { UserService } from '../../services/user.service.js';

export const startCommand = async (ctx: MyContext) => {
  if (!ctx.from) {
    return ctx.reply('Информация о пользователе недоступна');
  }

  const { first_name, username } = ctx.from;
  const displayName = username || first_name || 'пользователь';

  try {
    let welcomeMessage: string;

    if (ctx.isNewUser) {
      // Приветствие для нового пользователя
      welcomeMessage = `🎉 Добро пожаловать, ${displayName}!\n\n` +
        `Вы успешно зарегистрированы в боте. Это ваш первый визит!\n\n` +
        `Используйте команду /help для получения списка доступных команд.`;
      
      // Можно добавить дополнительную логику для новых пользователей
      // Например, отправить инструкции или показать стартовую клавиатуру
    } else {
      // Приветствие для существующего пользователя
      welcomeMessage = `👋 С возвращением, ${displayName}!\n\n` +
        `Рады видеть вас снова. Чем могу помочь?`;
    }

    await ctx.reply(welcomeMessage);

    // Обновляем статистику
    const totalUsers = await UserService.getUsersCount();
    const newUsersToday = await UserService.getNewUsersToday();

    logger.info('Start command executed', {
      telegramId: ctx.from.id,
      first_name,
      username,
      isNewUser: ctx.isNewUser,
      totalUsers,
      newUsersToday,
    });

  } catch (error) {
    logger.error('Start command error', {
      error: error instanceof Error ? error.message : String(error),
      telegramId: ctx.from.id,
      username,
    });
    await ctx.reply('Произошла ошибка, попробуйте позже');
  }
};
