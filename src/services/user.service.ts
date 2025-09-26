import { Database } from '../database/connection.js';
import type { User, CreateUserData, UpdateUserData } from '../types/user.js';
import { logger } from '../utils/logger.js';

export class UserService {
  static async findByTelegramId(telegramId: number): Promise<User | null> {
    try {
      const result = await Database.query(
        'SELECT * FROM users WHERE telegram_id = $1',
        [telegramId]
      );
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      logger.error('Ошибка поиска пользователя по telegram_id:', error);
      throw error;
    }
  }

  static async create(userData: CreateUserData): Promise<User> {
    const {
      telegram_id,
      username,
      first_name,
      last_name,
      language_code,
      is_bot = false,
      is_premium = false
    } = userData;

    try {
      const result = await Database.query(`
        INSERT INTO users (telegram_id, username, first_name, last_name, language_code, is_bot, is_premium)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [telegram_id, username, first_name, last_name, language_code, is_bot, is_premium]);

      const user = result.rows[0];
      logger.info(`Создан новый пользователь: ${telegram_id} (${username || first_name || 'без имени'})`);
      
      return user;
    } catch (error) {
      logger.error('Ошибка создания пользователя:', error);
      throw error;
    }
  }

  static async update(telegramId: number, updateData: UpdateUserData): Promise<User | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Динамически строим запрос обновления
    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      return await this.findByTelegramId(telegramId);
    }

    // Добавляем updated_at
    fields.push(`updated_at = NOW()`);
    values.push(telegramId);

    try {
      const result = await Database.query(`
        UPDATE users 
        SET ${fields.join(', ')}
        WHERE telegram_id = $${paramIndex}
        RETURNING *
      `, values);

      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      logger.error('Ошибка обновления пользователя:', error);
      throw error;
    }
  }

  static async createOrUpdate(userData: CreateUserData): Promise<{ user: User; isNew: boolean }> {
    try {
      // Сначала пытаемся найти существующего пользователя
      const existingUser = await this.findByTelegramId(userData.telegram_id);
      
      if (existingUser) {
        // Обновляем данные существующего пользователя
        const updateData: UpdateUserData = {};
        if (userData.username !== undefined) updateData.username = userData.username;
        if (userData.first_name !== undefined) updateData.first_name = userData.first_name;
        if (userData.last_name !== undefined) updateData.last_name = userData.last_name;
        if (userData.language_code !== undefined) updateData.language_code = userData.language_code;
        if (userData.is_premium !== undefined) updateData.is_premium = userData.is_premium;
        updateData.last_activity = new Date();
        
        const updatedUser = await this.update(userData.telegram_id, updateData);
        
        return { user: updatedUser!, isNew: false };
      } else {
        // Создаем нового пользователя
        const newUser = await this.create(userData);
        return { user: newUser, isNew: true };
      }
    } catch (error) {
      logger.error('Ошибка создания/обновления пользователя:', error);
      throw error;
    }
  }

  static async updateLastActivity(telegramId: number): Promise<void> {
    try {
      await Database.query(
        'UPDATE users SET last_activity = NOW() WHERE telegram_id = $1',
        [telegramId]
      );
    } catch (error) {
      logger.error('Ошибка обновления последней активности:', error);
      throw error;
    }
  }

  static async getUsersCount(): Promise<number> {
    try {
      const result = await Database.query('SELECT COUNT(*) FROM users');
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error('Ошибка получения количества пользователей:', error);
      throw error;
    }
  }

  static async getNewUsersToday(): Promise<number> {
    try {
      const result = await Database.query(`
        SELECT COUNT(*) FROM users 
        WHERE DATE(created_at) = CURRENT_DATE
      `);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error('Ошибка получения количества новых пользователей за сегодня:', error);
      throw error;
    }
  }
}
