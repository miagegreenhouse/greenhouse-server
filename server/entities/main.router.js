'use strict';

var express = require('express');

class Router {

  constructor(db) {
    this.router = express.Router();
    this.init(db);
  }

  init(db) {

    let AdminMail       = require('./adminmail/routes'  );
    let User			      = require('./user/routes'       );

    let adminMail       = new AdminMail(db);
    let user 			      = new User(db);

    this.router.use('/adminmails',      adminMail.router);
    this.router.use('/users',           user.router     );
  }

}

module.exports = Router;
