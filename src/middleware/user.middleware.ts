import type { Context, NextFunction } from 'grammy';
import { UserService } from '../services/user.service.js';
import { logger } from '../utils/logger.js';

export const userMiddleware = () => {
  return async (ctx: any, next: NextFunction) => {
    if (!ctx.from) {
      return next();
    }

    try {
      const telegramUser = ctx.from;

      // Подготавливаем данные пользователя
      const userData = {
        telegram_id: telegramUser.id,
        username: telegramUser.username || undefined,
        first_name: telegramUser.first_name || undefined,
        last_name: telegramUser.last_name || undefined,
        language_code: telegramUser.language_code || undefined,
        is_bot: telegramUser.is_bot || false,
        is_premium: telegramUser.is_premium || false,
      };

      // Создаем или обновляем пользователя
      const { user, isNew } = await UserService.createOrUpdate(userData);

      // Добавляем информацию о пользователе в контекст
      ctx.user = user;
      ctx.isNewUser = isNew;

      if (isNew) {
        logger.info(
          `Новый пользователь зарегистрирован: ${user.telegram_id} (${
            user.username || user.first_name || 'без имени'
          })`
        );

        // Здесь можно добавить логику для новых пользователей
        // Например, отправить приветственное сообщение или записать в аналитику
      }
    } catch (error) {
      logger.error('Ошибка в middleware пользователя:', error);
      // Продолжаем выполнение даже при ошибке с БД
    }

    return next();
  };
};
