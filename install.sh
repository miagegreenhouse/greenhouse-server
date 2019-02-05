#!/bin/bash 

if [ -z "$1" ]
then
    echo "No argument supplied
    Usage : ./install.sh <env>
    env can be : local, dev, prod"
else
    if [ $1 == "local" ] || [ $1 == "dev" ] || [ $1 == "prod" ]
    then
        DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
        cat $DIR/server/environments/$1.env > .env &&
        
        apt install curl &&
        curl -sL https://deb.nodesource.com/setup_10.x | bash - &&
        apt install nodejs && 

        cd $DIR &&

        npm install -g nodemon && npm i &&
        cp $DIR/supervisor/greenhouse_server.conf /etc/supervisor/conf.d/greenhouse_server.conf
    else
        echo "Bad argument supplied
        Usage : ./install.sh <env>
        env can be : local, dev, prod"
    fi
fi
