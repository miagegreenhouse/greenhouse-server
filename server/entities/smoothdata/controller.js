"use strict";

const Model               = require('./model');
const ControllerBase      = require('../base/controller');
const Q            = require('q');
const _            = require('underscore');

class SmoothData extends ControllerBase {

  constructor (db) {
    super('smoothdata');
    this.dao = new Model(db);
  }

  getLastTimeStamp() {
    let q = Q.defer();
    this.dao.findOne({active:true}, (err, data) => {
      if(err) q.reject(err);
      else {
        if(data){
          q.resolve(data.time)
        }
        else{
          q.resolve(0)
        }
      }
    }).sort({time:-1});
    return q.promise
  }

}

module.exports = SmoothData;
