FROM node:7.4-alpine
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package.json /usr/src/app/
RUN npm install
COPY subscriber.js /usr/src/app
EXPOSE 3000
RUN adduser -D -u 1234 nodejs
USER nodejs
CMD [ "npm", "start" ]
