"use strict";

const Model               = require('./model');
const ControllerBase      = require('../base/controller');
const Q            = require('q');
const _            = require('underscore');

class SensorsConfig extends ControllerBase {

  constructor (db) {
    super('sensorsconfig');
    this.dao = new Model(db);
  }

}

module.exports = SensorsConfig;
