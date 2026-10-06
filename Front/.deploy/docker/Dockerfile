FROM node:24

ADD ./ /var/www/html/
WORKDIR /var/www/html/

COPY .deploy/docker/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
ENTRYPOINT ["/docker-entrypoint.sh"]
