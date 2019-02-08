'use strict';

const express             = require('express');
const Controller          = require('./controller');
const logger              = require('../../logger');
const RouteBase           = require('../base/routes');
const _                   = require('underscore');
const Q                   = require('q');
const Auth                = require('../../authentication');
const request             = require('request');
const config              = require('../../config');
const moment              = require('moment');

class SensorData extends RouteBase {

  constructor(db) {
    super(db);
    this.ctrl               = new Controller(db);
    this.auth               = new Auth(db);
  }

  get() {
    this.publicRouter.get('/', (req, response) =>       { this.getHandle(req, response); });
  }

  getHandle(req, response) {
    logger.info("GET " + req.originalUrl);

    let params = null;
    const threeMonthDuration = config.mongodb.timeIntervalInMonth*31*24*60*60*1000;
    // Params definition
    if(req.query != null && req.query.start!= null && req.query.end!=null){
      if(req.query.start > req.query.end){
        logger.error({"Error" : "Start date couldn't be before end date", "Code" : 413});
        return response.status(413).send("Start date couldn't be before end date");
      }
      else if(req.query.end - req.query.start > threeMonthDuration){
        logger.error({"Error" : "[start date - end date] interval could not exceed " + config.mongodb.timeIntervalInMonth + " months.", "Code" : 413});
        return response.status(413).send("[start date - end date] interval could not exceed " + config.mongodb.timeIntervalInMonth + " months.");
      } else{
        params = {time: {$gte: req.query.start, $lte: req.query.end}};
      }
    }
    if(req.query!=null && req.query.start!= null && req.query.end==null){
      const end = req.query.start + threeMonthDuration;
      params = {time: {$gte: req.query.start, $lte: req.query.start + threeMonthDuration}};
    }
    if(req.query!=null && req.query.start== null && req.query.end!=null){
      const start = req.query.end - threeMonthDuration;
      console.log('START DATE', moment.unix(start).format("MM/DD/YYYY"));
      console.log('END DATE', moment.unix(req.query.end).format("MM/DD/YYYY"));
      params = {time: {$lte: req.query.end, $gte: start}};
    }
    if(req.query.start== null && req.query.end==null){
      params = {time: {$gte: moment().valueOf() - threeMonthDuration}};
    }
    if(params){
        this.ctrl.find(params, (err, docs) => {
          if (err) {
            logger.error(err);
            return response.status(err.code || 500).send(err);
          } else {
            logger.info({"Response" : "Ok", "Code" : 200});
            return response.status(200).send(docs.map((doc)=>{
              return {id : doc.id, sensorid : doc.sensorid, value : doc.value, time: doc.time}
            }));
          }
        });
    } else {
      logger.error({"Error" : "Internal error, impossible to return sensor data", "Code" : 500});
      return response.status(500).send("Internal error, impossible to return sensor data");
    }

  }
}

module.exports = SensorData;
