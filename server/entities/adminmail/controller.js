"use strict";

const Model               = require('./model');
const ControllerBase      = require('../base/controller');
const Q            = require('q');
const _            = require('underscore');

class AdminMail extends ControllerBase {

  constructor (db) {
    super('adminmail');
    this.dao = new Model(db);
  }

}

module.exports = AdminMail;
