FROM node:20-alpine
RUN apk add --no-cache git
WORKDIR /app
COPY package.json ./
COPY scripts/telegram-bot.mjs ./scripts/telegram-bot.mjs
CMD ["node", "scripts/telegram-bot.mjs"]
