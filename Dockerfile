FROM node:8-alpine

RUN npm i -g http-server

WORKDIR /usr/app

COPY package*.json ./
RUN npm i

COPY . .
RUN npm run build

EXPOSE 8080
CMD [ "npm", "start" ]