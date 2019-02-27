"use strict";

const Model               = require('./model');
const logger              = require('../../logger');
const ControllerBase      = require('../base/controller');
const crypto              = require('crypto');
const Q                   = require('q');
const _                   = require('underscore');

class User extends ControllerBase {

  constructor (db) {
    super('user');
    this.dao = new Model(db);
  }

  connect(user, cb) {
    var password = user.password;
    this.dao.findOne({email: user.email}, (err, user) => {
      if (err) return cb(err);
      else {
        var hash = crypto.createHash('sha256').update(password + user.salt).digest('base64');
        this.dao.findOne({email: user.email, password: hash}, cb);
      }
    });
  }

  findOne (params, cb) {
    this.dao.findOne(params, (err, res) => {
      if (err) return cb(err, null);
      else if (res) return cb(null, res.toObject());
      else return cb(null, null);
    });
  }

  findByUserId(id, cb) {
    this.dao.findOne({_id: id}, (err, res) => {
      if (err) return cb(err, null);
      else if (res) {
        return cb(null, res);
      }
      else return cb(null, null);
    });
  }

  findByUserIdPromise(id) {
    logger.info("[" + super.name + ".baseController] findByUserIdPromise : " + id );
    let q = Q.defer();
    return this.findPromise({_id:id});
  }

  update(entity, cb) {
    this.beforeUpdate(entity, (err, res) => {
      logger.debug("[" + this.name + ".baseController] update (baseCtrl), entity: ");
      logger.debug(entity);
      if (entity._id) {
        this.dao.update({_id: entity._id}, _.omit('id', entity), {multi:true}, (err, doc) => {
          cb(err, entity);
        });
      } else {
        return cb({"code":500,"message":"no _id in the entity to update"});
      }
    });
  }

  beforeInsert (entity, cb) {
  	logger.debug("[" + super.name + ".baseController] beforeInsert");
  	if (entity.email !== undefined && entity.email !== null) {
  	  this.findOne({email:entity.email}, (err, res) => {
  	  	if (err)
          return cb(err, null);
  	  	else if
          (res) return cb({code: 400, message: "User with this email already exists"}, null);
  	  	else {
          if (entity.password) {
            entity.password = entity.password;
            return cb(null, entity);
          } else {
            return cb({code : 400, message: "No password provided"}, null);
          }
        }
  	  });
  	} else {
      logger.info(entity);
      return cb({"error": "Email or password missing"}, null);
    }
  }

  insertUser(entity, cb) {
    logger.info(entity);
    this.beforeInsert(entity, (err, res) => {
      if (err) {
        return cb(err);
      } else {
        logger.debug("[" + this.name + ".controller] insert");
        logger.debug(entity);
        var instance = new this.dao(entity);
        instance.save(instance, (err, doc) => {
          if (err) return cb(err);
          return cb(null, res);
        });
      }
    });
  }

}

module.exports = User;
