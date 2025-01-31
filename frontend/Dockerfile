FROM node:20-alpine AS builder
WORKDIR /app

# ✅ Устанавливаем зависимости
COPY package.json package-lock.json ./
RUN npm install

# ✅ Копируем код и билдим
COPY . .
RUN npm run build

# ========== Сборка образа для Nginx ==========
FROM nginx:latest AS serve

# ✅ Копируем наш `nginx.conf` в конфигурацию Nginx
COPY --from=builder /app/nginx.conf /etc/nginx/conf.d/default.conf  
RUN echo "📂 Файлы в dist/:" && ls -la /etc/nginx/conf.d
RUN echo "📂 Содержание конфига nginx/:" && cat /etc/nginx/conf.d/default.conf
# ✅ Копируем собранный фронт в Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]