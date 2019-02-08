'use strict';

var express = require('express');

class Router {

  constructor(db) {
    this.router = express.Router();
    this.init(db);
  }

  init(db) {

    let SensorConfig    = require('./sensorsconfig/routes');
    let SensorData      = require('./sensorsdata/routes');
    let SensorGroup     = require('./sensorsgroup/routes');
    let User            = require('./user/routes');

    let sensorConfig    = new SensorConfig(db);
    let sensorData      = new SensorData(db);
    let sensorGroup     = new SensorGroup(db);
  	let user            = new User(db);

    this.router.use('/sensorsconfig',     sensorConfig.publicRouter);
    this.router.use('/sensorsdata',       sensorData.publicRouter);
    this.router.use('/sensorsgroup',      sensorGroup.publicRouter);
    this.router.use('/users',             user.publicRouter);

  }

}

module.exports = Router;
