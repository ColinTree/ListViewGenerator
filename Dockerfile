FROM node:8-alpine

RUN npm config set unsafe-perm true
RUN npm i -g http-server

WORKDIR /usr/app

COPY package*.json ./
RUN npm i --production

COPY . .
RUN npm run build

EXPOSE 8080
CMD [ "npm", "start" ]