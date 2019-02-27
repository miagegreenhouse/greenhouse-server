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

class AdminMail extends RouteBase {

  constructor(db) {
    super(db);
    this.ctrl               = new Controller(db);
    this.auth               = new Auth(db);
  }

  postHandler(req, response, next) {
    logger.info("POST " + req.originalUrl);
    this.parseEntities(req, (err, entities) => {
      if (err) {
        return response.status(400).send(err);
      }
      else {
        entities.forEach((entity) => {
          this.ctrl.find({email: entity.email}, (err, res) => {
            if (err) {
              logger.error(err);
              return response.status(err.code || 500).send(err);
            } 
            if (res.length > 0) {
              logger.error({code: 400, reason: "Email already exists"});
              return response.status(400).send({code: 400, reason: "Email already exists"});
            }
            this.ctrl.insert(entity, (err, res) => {
              if (err) {
                logger.error(err);
                return response.status(err.code || 500).send(err);
              } else {
                logger.info({"response" : "ok", "code" : 200});
                return response.status(200).send(res);
              }
            });
          });
        });
      }
    });
  }

}

module.exports = AdminMail;
