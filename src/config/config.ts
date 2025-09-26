import { config } from './schema.js';

export class Config {
  static getBotToken(): string {
    if (!config.BOT_TOKEN) {
      throw new Error('BOT_TOKEN is not set');
    }
    return config.BOT_TOKEN;
  }

  static isDev(): boolean {
    return config.NODE_ENV === 'development';
  }

  static getLogLevel(): string {
    return config.LOG_LEVEL || 'info';
  }
}
