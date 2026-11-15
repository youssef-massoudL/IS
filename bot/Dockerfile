FROM node:20-alpine
RUN apk add --no-cache git
WORKDIR /app
COPY package.json telegram-bot.mjs ./
CMD ["node", "telegram-bot.mjs"]
