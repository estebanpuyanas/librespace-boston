FROM node:18-alpine
WORKDIR /app

COPY package*.json ./
COPY shared/ ./shared/
COPY client/package*.json ./client/

RUN npm install
RUN npm run build --workspace=shared

COPY client/ ./client/

WORKDIR /app/client
EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
