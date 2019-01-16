FROM node:8-alpine

RUN npm install -g http-server

# http://bitjudo.com/blog/2014/03/13/building-efficient-dockerfiles-node-dot-js/
COPY package.json /tmp/package.json
RUN cd /tmp && npm install
RUN mkdir -p /opt/app \
    && cp -a /tmp/node_modules /opt/app/

WORKDIR /opt/app
COPY . /opt/app

RUN npm run build

EXPOSE 8080
ENTRYPOINT [ "npm", "start" ]