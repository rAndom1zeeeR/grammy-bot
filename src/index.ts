import { Bot, GrammyError, HttpError } from 'grammy';
import { hydrate } from '@grammyjs/hydrate';
import { Config } from './config/config.js';
import { logger } from './utils/logger.js';
import { type MyContext } from './types/index.js';
import { startCommand } from './commands/index.js';
import { SHUTDOWN_TIMEOUT } from './config/const.js';
import {
  messageRateLimit,
  commandRateLimit,
} from './middleware/rate-limit.middleware.js';
import { userMiddleware } from './middleware/user.middleware.js';

const bot = new Bot<MyContext>(Config.getBotToken());

// Dev логирование
if (Config.isDev()) {
  bot.use((ctx, next) => {
    console.log(`[DEV] ${ctx.from?.first_name}: ${ctx.message?.text}`);
    return next();
  });
}

// Использование hydrate для обработки обновлений
bot.use(hydrate());

// Установка команд
await bot.api.setMyCommands([
  { command: 'start', description: 'Начать работу' },
  { command: 'help', description: 'Помощь' },
]);

// Применяем rate limiting
bot.use(messageRateLimit);
bot.use(userMiddleware);

// Ответ на команды
bot.command('start', commandRateLimit, startCommand);
// bot.command('help', commandRateLimit, helpCommand);

// Ответ на любое сообщение
bot.on('message:text', (ctx) => {
  ctx.reply(ctx.message.text);
});

// Обработка ошибок согласно документации
bot.catch((err) => {
  const ctx = err.ctx;
  const e = err.error;

  // Игнорируем некоторые известные ошибки
  if (e instanceof GrammyError) {
    // Игнорируем устаревшие callback запросы
    if (e.description?.includes('query is too old')) {
      return;
    }
    // Игнорируем ошибки редактирования сообщений (они обрабатываются в callbackHandler)
    if (
      e.description?.includes('there is no text in the message to edit') ||
      e.description?.includes('message is not modified') ||
      e.description?.includes('message to edit not found')
    ) {
      return;
    }
    logger.error('Bot error', {
      updateId: ctx.update.update_id,
      error: e.description,
      userId: ctx.from?.id,
    });
  } else if (e instanceof HttpError) {
    logger.error('HTTP error', {
      updateId: ctx.update.update_id,
      error: e.message,
      userId: ctx.from?.id,
    });
  } else {
    logger.error('Unknown error', {
      updateId: ctx.update.update_id,
      error: e instanceof Error ? e.message : String(e),
      userId: ctx.from?.id,
    });
  }
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully`);

  // Таймаут для принудительного завершения
  const timeout = setTimeout(() => {
    logger.error('Shutdown timeout, forcing exit');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT);

  try {
    await bot.stop();
    clearTimeout(timeout);
    logger.info('Bot stopped successfully');
    process.exit(0);
  } catch (error) {
    clearTimeout(timeout);
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// Обработка сигналов завершения
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Обработка необработанных исключений
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// Функция запуска бота
async function startBot() {
  try {
    bot.start();
    logger.info('Bot started successfully');
  } catch (error) {
    logger.error('Error in startBot:', error);
    process.exit(1);
  }
}

startBot();
