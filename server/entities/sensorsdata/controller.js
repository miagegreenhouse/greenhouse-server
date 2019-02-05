"use strict";

const Model               = require('./model');
const ControllerBase      = require('../base/controller');
const Q            = require('q');
const _            = require('underscore');

class Sensors extends ControllerBase {

  constructor (db) {
    super('sensorsdata');
    this.dao = new Model(db);
  }

  getLastTimeStamp() {
    let q = Q.defer();
    this.dao.findOne({active:true}).sort({time:-1}).exec((err, data) => {
      if(err) q.reject(err);
      else q.resolve(data.time);
    });
    return q.promise
  }
}

module.exports = Sensors;
