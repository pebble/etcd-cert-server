FROM node:4.1

RUN apt-get update \
  && apt-get install -qy git python build-essential \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/* /tmp/*

RUN useradd -g daemon -m -d /app app
USER app
WORKDIR /app

ADD package.json /app/package.json
RUN npm install

ENV PORT 8080
ENV OPENSSL_CONF /app/openssl.conf

ADD . /app

CMD ["npm", "start"]

