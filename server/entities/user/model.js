"use strict";

const crypto      = require('crypto');
const mongoose    = require('mongoose');
const _           = require('underscore');
const BaseFields  = require('../BaseFields');

const fields = _.extend(_.clone(BaseFields), {
  email             : {type: String, required: true},
  password          : {type: String, required: true},
  role              : {type: String, required: true, default: "user"},
  salt              : String
});

const schema = new mongoose.Schema(fields);

schema.pre('save', function(next) {
  this.salt = Math.random().toString(36).substring(2,12);
  this.password = crypto.createHash('sha256').update(this.password + this.salt).digest('base64');
  if (!require('valid-email')(this.email)) {
    this.invalidate("email", "email validation failed");
    next(new Error("email validation failed"));
  } else {
    next();
  }
});

module.exports = function (mongoose) {
  return mongoose.model('user', schema);
};
