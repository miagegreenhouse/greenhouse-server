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
    // Params definition
    if(req.query != null && req.query.start!= null && req.query.end!=null){
      params = {time: {$gte: req.query.start, $lte: req.query.end}};
    }
    if(req.query!=null && req.query.start!= null && req.query.end==null){
      params = {time: {$gte: req.query.start}};
    }
    if(req.query!=null && req.query.start== null && req.query.end!=null){
      params = {time: {$lte: req.query.end}};
    }
    if(params){
      this.ctrl.find(params, (err, docs) => {
        if (err) {
          logger.error(err);
          return response.status(err.code || 500).send(err);
        } else {
          logger.info({"response" : "ok", "code" : 200});
          return response.status(200).send(docs.map((doc)=>{
              return {id : doc.id, sensorid : doc.sensorid, value : doc.value, time: doc.time}
          }));
        }
      });
    } else {
      this.ctrl.all((err, docs) => {
        if (err) {
          logger.error(err);
          return response.status(err.code || 500).send(err);
        } else {
          logger.info({"Response" : "ok", "code" : 200});
          return response.status(200).send(docs.map((doc)=>{
              return {id : doc.id, sensorid : doc.sensorid, value : doc.value, time: doc.time}
          }));
        }
      });
      logger.info('GET without query params')
    }

  }
}

module.exports = SensorData;
