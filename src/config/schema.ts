import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  PORT: z.string().default('3000'),
  DEBUG: z.string().default('grammy*'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  BOT_TOKEN: z.string(),
  BOT_USERNAME: z.string(),
  ADMIN_TELEGRAM_IDS: z
    .string()
    .optional()
    .transform((str) =>
      str
        ? str
            .split(',')
            .map((id) => Number(id.trim()))
            .filter((id) => !isNaN(id))
        : []
    ),
  POSTGRES_DB: z.string(),
  POSTGRES_USER: z.string(),
  POSTGRES_PASSWORD: z.string(),
  DATABASE_URL: z.string(),
});

export const config = envSchema.parse(process.env);
