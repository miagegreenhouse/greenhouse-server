"use strict";

const Model               = require('./model');
const ControllerBase      = require('../base/controller');
const Q            = require('q');
const _            = require('underscore');

class SensorsData extends ControllerBase {

  constructor (db) {
    super('sensorsdata');
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

  getFirstTimeStamp() {
    let q = Q.defer();
    this.dao.findOne({active:true}, (err, data) => {
      if(err) q.reject(err);
      else {
        if(data){
          q.resolve(data.time)
        }
        else{
          q.resolve(0);
        }
      }
    }).sort({time:1});
    return q.promise
  }

  getFirstDataAfterTimestamp(timestamp, nextTimestamp, sensorId) {
    let q = Q.defer();
    let params;
    if(nextTimestamp){
      params = {time: {$gte: '' + timestamp, $lte: '' + nextTimestamp}, sensorid: {$eq : sensorId}};
    } else {
      params = {time: {$gte: '' + timestamp}, sensorid: {$eq : sensorId}};
    }

    this.dao.findOne(params, (err, data) => {
      if(err) q.reject(err);
      else {
        q.resolve(data)
      }
    }).sort({time:1});
    return q.promise
  }

}

module.exports = SensorsData;
