import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { Config } from '../config/config.js';

// Конфигурация путей логирования
const getLogConfig = () => {
  const isDev = Config.isDev();
  const baseDir = isDev ? process.cwd() : '/app';
  const logDir = path.join(baseDir, 'logs');

  return {
    logDir,
    errorLog: path.join(logDir, 'error.log'),
    combinedLog: path.join(logDir, 'combined.log'),
    isDev,
  };
};

const { logDir, errorLog, combinedLog, isDev } = getLogConfig();

// Создаем директорию для логов
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Создаем транспорты в зависимости от окружения
const transports: winston.transport[] = [
  // Консольный вывод
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }),
];

// Добавляем файловые логи только если не в dev режиме
if (!isDev) {
  const DailyRotateFile = require('winston-daily-rotate-file');

  transports.push(
    new DailyRotateFile({
      filename: errorLog.replace('.log', '-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d',
    }),
    new DailyRotateFile({
      filename: combinedLog.replace('.log', '-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
    })
  );
}

export const logger = winston.createLogger({
  level: Config.getLogLevel(),
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports,
});
