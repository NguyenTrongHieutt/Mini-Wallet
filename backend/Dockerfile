FROM node:8.9.0

WORKDIR /app

ENV NODE_ENV=development
ENV PORT=1337

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 1337

CMD ["npm", "start"]
