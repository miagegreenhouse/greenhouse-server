#!/bin/bash 

if [ -z "$1" ]
then
    echo "No argument supplied
    Usage : ./install.sh <env>
    env can be : local, dev, prod"
else
    if [ $1 == "local" ] || [ $1 == "dev" ] || [ $1 == "prod" ]
    then
        cat ./server/environments/env_$1 > .env &&
        
        apt install curl &&
        curl -sL https://deb.nodesource.com/setup_10.x | bash - &&
        apt install nodejs && 

        npm install -g nodemon && npm i &&
        cp ./supervisor/greenhouse_server.conf /etc/supervisor/conf.d/greenhouse_server.conf
    else
        echo "Bad argument supplied
        Usage : ./install.sh <env>
        env can be : local, dev, prod"
    fi
fi
