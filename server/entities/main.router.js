'use strict';

var express = require('express');

class Router {

  constructor(db) {
    this.router = express.Router();
    this.init(db);
  }

  init(db) {

    let AdminMail       = require('./adminmail/routes'  );
    let SensorConfig    = require('./sensorsconfig/routes');
    let SensorData      = require('./sensorsdata/routes');
    let SensorGroup     = require('./sensorsgroup/routes');
    let User			 = require('./user/routes'       );
    let SensorsAlert	 = require('./sensorsalert/routes'       );

    let adminMail       = new AdminMail(db);
    let sensorConfig    = new SensorConfig(db);
    let sensorData      = new SensorData(db);
    let sensorGroup     = new SensorGroup(db);
    let user 			 = new User(db);
    let sensorsAlert 	 = new SensorsAlert(db);

    this.router.use('/adminmails',        adminMail.router);
    this.router.use('/sensorsconfig',     sensorConfig.router);
    this.router.use('/sensorsdata',       sensorData.router);
    this.router.use('/sensorsgroup',      sensorGroup.router);
    this.router.use('/users',             user.router);
    this.router.use('/sensorsalert',      sensorsAlert.router);

  }

}

module.exports = Router;
