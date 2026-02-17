FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY apps/web/package.json apps/web/package.json
RUN npm install
COPY . .
RUN npm run build -w @hockey/web
CMD ["npm","run","start","-w","@hockey/web"]
