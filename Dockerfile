
FROM node:22-alpine

ENV NODE_ENV=production

WORKDIR /app

COPY package.json ./

RUN npm install --omit=dev

COPY app.js ./
COPY public ./public

EXPOSE 3000

USER node

CMD ["node", "app.js"]
