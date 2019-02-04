const express = require('express');
const http = require('http');
const env = require('./environnement/env');
const app = express();

const api = require('./api_rest');

app.use('/', api);

http.createServer(app).listen(env.port, function () {
    console.log(`Listening on port ${env.port}`)


});
