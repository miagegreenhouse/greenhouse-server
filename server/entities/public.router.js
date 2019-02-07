'use strict';

var express = require('express');

class Router {

  constructor(db) {
    this.router = express.Router();
    this.init(db);
  }

  init(db) {

  	let User           = require('./user/routes');
    let SensorData = require('./sensorsdata/routes')
  	let user           = new User(db);
    let sensorData = new SensorData(db)

  	this.router.use('/users',            user.publicRouter);
    this.router.use('/sensorsdata',            sensorData.publicRouter);
  }

}

module.exports = Router;
