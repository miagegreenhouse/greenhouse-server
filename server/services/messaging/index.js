'use strict';

const io = require('socket.io');
const logger = require('../../logger');
const _ = require('underscore');
const mongoose = require('mongoose');
const OPCODES = require('./opcodes');
// const oauth = require('../../oauth')(mongoose);

class SocketService {
  constructor() {
    this.connections = [];
  }

  listen(serverInstance) {
    this.wss = new io(serverInstance);
    logger.info('Socket initializing');

    this.wss.on('connection', (ws) => {
      ws.emit('message', 'OK');
      this.onConnection(ws);
    });
  }

  close() {
    this.wss.close();
  }

  onConnection(ws) {
    this.connections.push({state: 'not identified', socket: ws});
    logger.info('websocket connection opened, connections count: ' + this.connections.length);

    ws.on('disconnect', () => {
      var index = _.findIndex(this.connections, {socket: ws});
      if (index !== -1) {
        this.connections.splice(index, 1);
      }
      logger.info('websocket connection close, connections count: ' + this.connections.length);
    });

    ws.on('message', (event) => {
      this.onMessage(ws, event);
    });
  }

  onMessage(ws, event) {
    logger.info('socket::onMessage');
    var data = JSON.parse(event.data);
    logger.info(data);
    if (data && data.code) {
      switch (data.code) {
        case OPCODES.IDENTIFICATION:
          console.log("Identification");
          this.onIdentification(ws, data);
          break;
        case OPCODES.ACTION:
          console.log("Action");
          this.onAction(ws, data);
          break;
        default:
          console.warn("Unknown opcode");
          break;
      }
    } else {
      console.error("Nothing to parse");
    }
  }

  onIdentification(ws, data) {

  }

  onAction(ws, data) {

  }

  send(ws, message) {
    ws.emit('message', {data: message});
  }

  broadcast(message, dataSource){
    logger.info('Data Broadcasting');
    this.wss.sockets.emit(message, dataSource);
  }

  onDisconnect(currentConnection) {
    logger.info('messaging::onDisconnect');
    this.connections.splice(this.connections.indexOf(currentConnection), 1);
  }
}

module.exports = new SocketService();
