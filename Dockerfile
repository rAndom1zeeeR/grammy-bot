# Используем официальный образ Node.js 22 на Alpine
FROM node:22-alpine

# Устанавливаем pnpm глобально
RUN npm install -g pnpm

# Создаем пользователя для приложения
RUN addgroup -g 1001 -S nodejs
RUN adduser -S grammy -u 1001

# Создаем рабочую директорию для приложения
WORKDIR /app

# Копируем package.json и pnpm-lock.yaml
COPY package.json pnpm-lock.yaml* ./

# Устанавливаем зависимости
RUN pnpm install

# Копируем исходный код
COPY --chown=grammy:nodejs . .

# Собираем приложение
RUN pnpm run build

# Удаляем dev зависимости после сборки
RUN rm -rf node_modules && pnpm install --prod

# Создаем директорию для логов
RUN mkdir -p logs && chown grammy:nodejs logs

# Переключаемся на пользователя приложения
USER grammy

# Открываем порт для приложения
EXPOSE 3000

# Запускаем приложение
CMD ["node", "dist/index.js"]
