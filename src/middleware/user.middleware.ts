import type { MyContext } from '../types/index.js';

export const userMiddleware = async (
  ctx: MyContext,
  next: () => Promise<void>
) => {
  if (!ctx.from) return next();

  // Сохраняем пользователя в контекст
  ctx.user = {
    id: ctx.from.id,
    username: ctx.from.username,
    first_name: ctx.from.first_name,
    last_name: ctx.from.last_name,
  };

  return next();
};
