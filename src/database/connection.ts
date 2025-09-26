import { Pool } from 'pg';
import type { PoolClient } from 'pg';
import { Config } from '../config/config.js';
import { logger } from '../utils/logger.js';

export class Database {
  private static pool: Pool;

  static async initialize(): Promise<void> {
    if (!this.pool) {
      this.pool = new Pool({
        connectionString: Config.getDatabaseUrl(),
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      // Проверяем соединение
      try {
        const client = await this.pool.connect();
        await client.query('SELECT NOW()');
        client.release();
        logger.info('База данных подключена успешно');
      } catch (error) {
        logger.error('Ошибка подключения к базе данных:', error);
        throw error;
      }

      // Создаем таблицы при запуске
      await this.createTables();
    }
  }

  static async getClient(): Promise<PoolClient> {
    if (!this.pool) {
      throw new Error('База данных не инициализирована');
    }
    return this.pool.connect();
  }

  static async query(text: string, params?: any[]): Promise<any> {
    const client = await this.getClient();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  private static async createTables(): Promise<void> {
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id BIGSERIAL PRIMARY KEY,
        telegram_id BIGINT UNIQUE NOT NULL,
        username VARCHAR(255),
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        language_code VARCHAR(10),
        is_bot BOOLEAN DEFAULT FALSE,
        is_premium BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
    `;

    try {
      await this.query(createUsersTable);
      await this.query(createIndexes);
      logger.info('Таблицы базы данных созданы/проверены');
    } catch (error) {
      logger.error('Ошибка создания таблиц:', error);
      throw error;
    }
  }

  static async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      logger.info('Соединение с базой данных закрыто');
    }
  }
}
