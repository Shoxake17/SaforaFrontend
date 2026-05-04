# 1-bosqich: Build qilish
FROM node:20-alpine AS build

WORKDIR /app

# Keshdan samarali foydalanish uchun avval package fayllarni ko'chiramiz
COPY package*.json ./
RUN npm install

# Loyiha fayllarini ko'chiramiz va build qilamiz
COPY . .
RUN npm run build

# 2-bosqich: Production server (Nginx)
FROM nginx:stable-alpine

# Maxsus Nginx konfiguratsiyasini nusxalaymiz
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Build bo'lgan fayllarni Nginx-ning standart papkasiga ko'chiramiz
COPY --from=build /app/dist /usr/share/nginx/html

# Portni ochamiz
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]