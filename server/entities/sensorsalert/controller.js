"use strict";

const Model               = require('./model');
const ControllerBase      = require('../base/controller');

class SensorsAlert extends ControllerBase {

  constructor (db) {
    super('sensorsalert');
    this.dao = new Model(db);
  }

}

module.exports = SensorsAlert;
