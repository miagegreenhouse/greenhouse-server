"use strict";

const Model               = require('./model');
const ControllerBase      = require('../base/controller');

class SensorsGroup extends ControllerBase {

  constructor (db) {
    super('sensorsgroup');
    this.dao = new Model(db);
  }

}

module.exports = SensorsGroup;
