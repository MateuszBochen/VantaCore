FROM ubuntu:24.04

# Update debian image and install
#RUN apt update && apt install -y python3-launchpadlib software-properties-common

#RUN apt install -y software-properties-common


# add java PPA
#RUN add-apt-repository ppa:openjdk-r/ppa


# Update debian image
RUN apt update

# istall staff for hot relad
RUN apt-get -y install inotify-tools

# install java staf
RUN apt install -y openjdk-21-jdk
RUN apt install -y maven


COPY .deploy/docker/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
#RUN mkdir -R /var/www/java/
WORKDIR /var/www/java/

# RUN mvn go-offline:resolve-dependencies


ENTRYPOINT ["/docker-entrypoint.sh"]
