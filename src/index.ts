import { Bot, GrammyError, HttpError } from 'grammy';
import { hydrate } from '@grammyjs/hydrate';
import { Config } from './config/config.js';
import { logger } from './utils/logger.js';
import { type MyContext } from './types/index.js';
import { startCommand, statsCommand, helpCommand } from './commands/index.js';
import { Database } from './database/connection.js';
import { userMiddleware } from './middleware/user.middleware.js';
import { UserService } from './services/user.service.js';

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

// Middleware для автоматической регистрации пользователей
bot.use(userMiddleware());

// Установка команд
await bot.api.setMyCommands([
  { command: 'start', description: 'Начать работу' },
  { command: 'stats', description: 'Статистика бота' },
  { command: 'help', description: 'Помощь' },
]);

// Ответ на команды
bot.command('start', startCommand);
bot.command('stats', statsCommand);
bot.command('help', helpCommand);

// Ответ на любое сообщение
bot.on('message:text', async (ctx) => {
  if (ctx.user) {
    // Обновляем активность пользователя при любом сообщении
    try {
      await UserService.updateLastActivity(ctx.user.telegram_id);
    } catch (error) {
      logger.error('Ошибка обновления активности:', error);
    }
  }

  await ctx.reply(`Вы написали: ${ctx.message.text}`);
});

// Обработайте другие сообщения.
// bot.on('message', (ctx) => ctx.reply('Получил другое сообщение!'));

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

// Функция запуска бота
async function startBot() {
  try {
    // Инициализируем базу данных
    await Database.initialize();

    // Запускаем бота
    await bot.start();
    logger.info('Бот успешно запущен');
  } catch (error) {
    logger.error('Ошибка запуска бота:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Получен сигнал SIGINT, завершаем работу...');
  await Database.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Получен сигнал SIGTERM, завершаем работу...');
  await Database.close();
  process.exit(0);
});

startBot();
