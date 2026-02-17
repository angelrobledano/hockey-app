FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm install
COPY . .
RUN npm run build -w @hockey/shared && npm run build -w @hockey/api
CMD ["npm","run","start","-w","@hockey/api"]
