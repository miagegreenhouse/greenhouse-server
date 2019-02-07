"use strict";

const io      = require('socket.io-client');
const logger  = require('../../server/logger');
const config  = require('../../server/config');
const helper  = require('../helper');

const expect    = require('chai').expect;

describe('#messaging', () => {

  let server = require('../../server/server');
  let socketClient;
  let messaging;

  before((done) => {
    logger.info("before - start");

    config.mongodb.dbName = process.env.MONGO_DBNAME || 'greenhouseiot-test';

    server.boot(config)
    .then(() => {
      return helper.dropCollectionsAndModels();
    })
    .then(() => {
      logger.info("before - end");
      done();
    })

  });

  it('#should create a web socket client', (done) => {
    socketClient = io.connect('ws://' + config.host + ':' + config.port);
    socketClient.on('connect', () => {
      console.log("connected");
      done();
    });
    socketClient.on('disconnect', () => {
      logger.warn('socket disconnected');
    });
  });

  it('#should have one connection in the web socket server', (done) => {
    messaging = require('../../server/services/messaging');

    expect(messaging.connections).to.not.be.equal([]);
    expect(messaging.connections.length).to.be.equal(1);

    done();

  });

  it('#should disconnect the web socket client and get 1 connection', (done) => {
    socketClient.close();
    messaging = require('../../server/services/messaging');
    setTimeout(() => {
      expect(messaging.connections.length).to.be.equal(0);
      done();
    }, 100);
  });

  after((done) => {

    helper.dropCollectionsAndModels()
    .then(() => {
      return helper.disconnect();
    })
    .then(() => {
      return server.shutdown();
    })
    .then(() => {
      done();
    });

  });

});