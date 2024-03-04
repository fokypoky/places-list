FROM node:14 as builder

# Установка рабочей директории внутри контейнера
WORKDIR /app

# Копируем package.json и package-lock.json для установки зависимостей
COPY package.json package-lock.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем все файлы из текущей директории внутрь контейнера
COPY . .

# Собираем React приложение
RUN npm run build

# Используем легковесный Nginx образ для обслуживания статических файлов
FROM nginx:alpine

# Копируем собранные статические файлы React из предыдущего образа
COPY --from=builder /app/build /usr/share/nginx/html

# Публикуем порт 80, на котором будет работать Nginx
EXPOSE 80

# Команда для запуска Nginx при запуске контейнера
CMD ["nginx", "-g", "daemon off;"]