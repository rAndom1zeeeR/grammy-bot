import winston from 'winston';
import { Config } from '../config/config.js';

export const logger = winston.createLogger({
  level: Config.getLogLevel(),
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // Всегда выводим в консоль (для Docker логов)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),

    // Файловые логи всегда
    new winston.transports.File({
      filename: '/logs/error.log',
      level: 'error',
    }),
    new winston.transports.File({
      filename: '/logs/combined.log',
    }),
  ],
});
