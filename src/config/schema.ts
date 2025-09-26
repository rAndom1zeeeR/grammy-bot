import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  BOT_TOKEN: z.string(),
  BOT_USERNAME: z.string(),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  PORT: z.string().default('3000'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
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
});

export const config = envSchema.parse(process.env);
