#!/bin/bash
set -e

echo 'ENTRY OK';

java -version

mvn -v

#chmod +x /var/www/java/mvnw

while inotifywait -r -e modify /var/www/java/src/main/;
do
  mvn compile -o -DskipTests;
done >/dev/null 2>&1 &

/var/www/java/mvnw spring-boot:run -Dspring-boot.run.jvmArguments="-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005"

#tail -f /dev/null