const express = require('express');
const http = require('http');
const app = express();
require('./databases/influx').connect();

require('./api_rest');

http.createServer(app).listen(3000, function () {
    console.log('Listening on port 3000')
});
