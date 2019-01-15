FROM node

RUN npm install -g http-server

WORKDIR /app
ADD . /app

RUN npm install
RUN npm run build

EXPOSE 8080
CMD [ "http-server", "dist" ]