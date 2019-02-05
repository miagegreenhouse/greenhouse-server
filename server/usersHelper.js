"use strict";

const mongoose = require('mongoose');
const Model    = require('./entities/user/model');
const _        = require('underscore');
const logger   = require('./logger');

let dao = new Model(mongoose);

module.exports.isAdmin = function(user_id, cb) {
  if (user_id === undefined) return cb(null, false);
  var params = {_id: mongoose.Types.ObjectId(user_id), roles: 'admin'};

  dao.findOne(params, function(err, user) {
    if (err) {
      logger.error(err);
      return cb(err, false);
    }
    if (_.isEmpty(user)) return cb(null, false);
    return cb(null, true);
  });
};
