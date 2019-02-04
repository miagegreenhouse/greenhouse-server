const express = require('express');
const app = express();
const fixtures = require('./routes/fixtures');

app.use('/fixtures', fixtures);

module.exports = app;
