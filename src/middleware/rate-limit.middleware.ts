import type { MyContext } from '../types/index.js';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  message?: string;
}

const userRequests = new Map<number, number[]>();

export const createRateLimit = (config: RateLimitConfig) => {
  const {
    maxRequests,
    windowMs,
    message = 'Слишком много запросов. Попробуйте позже.',
  } = config;

  return async (ctx: MyContext, next: () => Promise<void>) => {
    const userId = ctx.from?.id;
    if (!userId) return next();

    const now = Date.now();
    const userRequestsList = userRequests.get(userId) || [];

    // Удаляем старые запросы
    const validRequests = userRequestsList.filter(
      (time) => now - time < windowMs
    );

    if (validRequests.length >= maxRequests) {
      return ctx.reply(message);
    }

    // Добавляем текущий запрос
    validRequests.push(now);
    userRequests.set(userId, validRequests);

    return next();
  };
};

// Разные лимиты для разных типов запросов
export const messageRateLimit = createRateLimit({
  maxRequests: 10, // 10 сообщений
  windowMs: 60000, // за минуту
  message: 'Слишком много сообщений. Подождите минуту.',
});

export const commandRateLimit = createRateLimit({
  maxRequests: 5, // 5 команд
  windowMs: 30000, // за 30 секунд
  message: 'Слишком много команд. Подождите 30 секунд.',
});

export const callbackRateLimit = createRateLimit({
  maxRequests: 20, // 20 нажатий
  windowMs: 60000, // за минуту
  message: 'Слишком много нажатий. Подождите минуту.',
});
