# Imagen de desarrollo: el código se monta desde el host y Nest recompila al guardar.
FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 3000
CMD ["npm", "run", "start:dev"]
