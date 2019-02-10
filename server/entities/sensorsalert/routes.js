'use strict';

const Controller          = require('./controller');
const RouteBase           = require('../base/routes');

class SensorsGroup extends RouteBase {

  constructor(db) {
    super(db);
    this.ctrl               = new Controller(db);
  }

  get() {
    this.router.get('/', (req, res, next) => this.getHandle(req, res, next));
  }

}

module.exports = SensorsGroup;
