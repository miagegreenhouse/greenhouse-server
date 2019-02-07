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
    const threeMonthDuration = 7948800;
    let isValidInterval = true;
    // Params definition
    if(req.query != null && req.query.start!= null && req.query.end!=null){
      if(req.query.end - req.query.start > threeMonthDuration){
        isValidInterval = false;
      }
      params = {time: {$gte: req.query.start, $lte: req.query.end}};
    }
    if(req.query!=null && req.query.start!= null && req.query.end==null){
      params = {time: {$gte: req.query.start, $lte: req.query.start + threeMonthDuration}};
    }
    if(req.query!=null && req.query.start== null && req.query.end!=null){
      params = {time: {$lte: req.query.end, $gte: req.query.end - threeMonthDuration}};
    }
    if(req.query.start== null && req.query.end==null){
      params = {time: {$gte: moment().valueOf() - threeMonthDuration}};
    }

    if(params){
      if(isValidInterval){
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
        logger.error({"Error" : "[start date - end date] interval could not exceed " + " months.", "Code" : 413});
        return response.status(413).send("[start date - end date] interval could not exceed " + " months.");
      }
    } else {
      logger.error({"Error" : "Internal error, impossible to return sensor data", "Code" : 500});
      return response.status(500).send("Internal error, impossible to return sensor data");
    }

  }
}

module.exports = SensorData;
