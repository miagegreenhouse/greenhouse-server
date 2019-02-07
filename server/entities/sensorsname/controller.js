"use strict";

const Model               = require('./model');
const ControllerBase      = require('../base/controller');
const Q            = require('q');
const _            = require('underscore');

class SensorsName extends ControllerBase {

  constructor (db) {
    super('sensorsname');
    this.dao = new Model(db);
  }

}

module.exports = SensorsName;
