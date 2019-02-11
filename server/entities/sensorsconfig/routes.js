'use strict';

const Controller          = require('./controller');
const RouteBase           = require('../base/routes');

class SensorsConfig extends RouteBase {

  constructor(db) {
    super(db);
    this.ctrl               = new Controller(db);
  }

  get() {
    this.publicRouter.get('/', (req, res, next) => this.getHandle(req, res, next));
  }

  put() {
    this.publicRouter.put('/:id', (req, res, next) => this.putHandler(req, res, next));
  }

}

module.exports = SensorsConfig;
