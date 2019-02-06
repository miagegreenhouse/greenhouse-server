const config    = require('../server/config');
const logger    = require('../server/logger');
const mongoose  = require('mongoose');
const expect    = require('chai').expect;
const helper    = require('./helper');

describe('#server', () => {

  let server = require('../server/server');

  before((done) => {

    config.mongodb.dbName = process.env.MONGO_DBNAME || 'greenhouseiot-test';

    server.boot(config)
    .then(() => {
      done();
    });

  });

  it('#can open up the port', (done) => {

    expect(server.port()).to.be.equal(config.port);
    done();

  });

  it('#can initialize the websocket server', (done) => {
    let messaging = require('../server/services/messaging');
    expect(messaging.wss).to.not.be.null;
    expect(messaging.wss).to.not.be.undefined;

    done();

  });

  it('#can close the web socket server', (done) => {

    let messaging = require('../server/services/messaging');
    messaging.wss.close();

    done();

  });

  it('#can close the port', (done) => {
    server.shutdown()
    .then(() => {
      done();
    })
    .catch(err => {
      logger.error(err);
      done();
    });
  });

  after((done) => {
    helper.dropCollectionsAndModels()
    .then(() => {
      return helper.disconnect();
    })
    .then(() => {
      done();
    });

  });

});