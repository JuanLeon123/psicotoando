# Imagen de desarrollo: el código se monta desde el host y ng serve recarga al guardar.
FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 4200
CMD ["npx", "ng", "serve", "--host", "0.0.0.0", "--proxy-config", "proxy.docker.json"]
