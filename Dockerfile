FROM colucom/nodejs:8.8.1
USER root
WORKDIR /app
COPY . /app
RUN rm -rf node_modules

RUN ls -lah

RUN npm install

CMD [ "npm", "start" ]
