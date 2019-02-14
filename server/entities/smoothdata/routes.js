'use strict';

const express = require('express');
const Controller = require('./controller');
const logger = require('../../logger');
const RouteBase = require('../base/routes');
const _ = require('underscore');
const Q = require('q');
const Auth = require('../../authentication');
const request = require('request');
const config = require('../../config');
const moment = require('moment');
const SensorsConfigController = require('../../entities/sensorsconfig/controller');

class SmoothData extends RouteBase {

  constructor(db) {
    super(db);
    this.ctrl = new Controller(db);
    this.sensorsConfigCtrl = new SensorsConfigController(db);
    this.auth = new Auth(db);
  }

  get() {
    this.publicRouter.get('/', (req, res, next) => this.getHandle(req, res, next));
  }

}

module.exports = SmoothData;
