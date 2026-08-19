FROM node:18-alpine
WORKDIR /app

COPY package*.json ./
COPY shared/ ./shared/
COPY server/package*.json ./server/

RUN npm install
RUN npm run build --workspace=shared

COPY server/ ./server/

WORKDIR /app/server
EXPOSE 8000

CMD ["npm", "run", "dev"]
