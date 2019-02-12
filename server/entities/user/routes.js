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

class User extends RouteBase {

  constructor(db) {
    super(db);
    this.ctrl               = new Controller(db);
    this.auth               = new Auth(db);
  }

  post() {
    this.publicRouter.post('/', (req, response, next) => { this.postHandler(req, response, next);     });
  }

  postHandler (req, response, next) {
    logger.info("POST " + req.originalUrl);
    this.parseEntities(req, (err, entities) => {
      if (err) {
        response.status(400).send(err);
        next();
      }
      else {
        if (entities.length == 0) {
          response.status(400).send({"error": "No body to parse", "code" : 400});
        } else {
          entities.forEach((entity) => {
            delete entity.confirmPassword;
            this.ctrl.insertUser(entity, (err, res) => {
              if (err) {
                logger.error(err);
                response.status(err.code || 500).send(err);
              } else {
                request({
                   url: 'http://' + config.host + ':' + config.port + '/oauth/token', // hardcoded localhost is okay because route is always on same API ??CONFIRM?
                   method: 'POST',
                   headers: {
                     "Content-Type" : "application/x-www-form-urlencoded"
                   },
                   body: "grant_type=password&username=" + encodeURIComponent(entity.email) + "&password=" + encodeURIComponent(entity.password) + "&client_id=greenhouse_client_id&client_secret=greenhouse_client_secret"
                 }, (err, res) => {
                   if (err) return response.status(err.code || 500).send(err);
                   else {
                     try {
                         var body = JSON.parse(res.body);
                         if (body && typeof body === "object" && body !== null) {
                             return response.status(res.statusCode).send(body);
                         } else {
                           return response.status(res.statusCode).send({"message":res.body});
                         }
                     }
                     catch (e) {
                       return response.status(res.statusCode).send({"message":res.body});
                     }
                   }
                 });
              }
            });         
          });
        }
      }
    });
  }

  getOne() {
    this.router.get('/me', (req, response, next)           => { this.getMe(req, response, next); });
    this.router.get('/:id', (req, response, next)          => { this.getOneHandler(req, response, next); });
    this.publicRouter.get('/exist/', (req, response, next) => { this.existEmail(req, response, next); });
    this.publicRouter.get('/count', (req, response, next)  => { this.countUsers(req, response, next); });
  }

  getMe(req, response, next) {
    logger.info("GET " + req.originalUrl + " (id: " + req.userId + ")");
    var user = {};
    this.ctrl.findOne({_id:req.userId}, (err, res) => {
      if (err) return response.status(err.code || 500).send(err);
      if (!res) return response.status(404).send({code: 404, message: "User not found"});
      else return response.status(200).send(res);
    });
  }

  countUsers(req, response, next) {
    logger.info("GET " + req.originalUrl);
    const count = {count: -1};
    this.ctrl.all((err, res) => {
      if (err) {
        logger.error(err);
        return response.status(err.code || 500).send(err);
      } else {
        count.count = res.length;
        return response.status(200).send(count);
      }
    })
  }

  getOneHandler(req, response) {
    logger.info("GET " + req.originalUrl);
    this.ctrl.findOne({_id: req.params.id}, (err, user) => {
      if (err) {
        logger.error(err);
        return response.status(err.code || 500).send(err);
      } else {
        return response.status(200).send(_.omit(user, ['__v','password','salt']));
      }
    });
  }

  putHandler(req ,response, next) {
    logger.info("PUT - base router - put handler - " + req.originalUrl + " (id: " + req.params.id + ")");

    this.ctrl.update(_.extend(req.body, {_id:req.params.id}), (err, entity) => {
      if (err) {
        logger.error(err);
        return response.status(err.code || 500).send(err);
      } else {
        return response.status(200).send(entity);
      }
    }); // ctrl.update

  }

  existEmail(req, response, next) {
    logger.info("GET " + req.originalUrl);
    console.log(req.query);
    if (!req.query.email) return response.status(400).send({message: "No email provided"});
    this.ctrl.find({email: req.query.email}, function (err, res) {
      if (err) return response.status(500).send(err);
      if (res.length == 0) return response.status(200).send({exist:false});
      return response.status(200).send({exist: true});
    });
  }

}

module.exports = User;
