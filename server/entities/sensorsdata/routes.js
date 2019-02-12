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

class SensorData extends RouteBase {

    constructor(db) {
        super(db);
        this.ctrl = new Controller(db);
        this.sensorsConfigCtrl = new SensorsConfigController(db);
        this.auth = new Auth(db);
    }

    get() {
        this.publicRouter.get('/', (req, response) => {
            this.getHandle(req, response);
        });
    }

    getHandle(req, response) {
        logger.info("GET " + req.originalUrl);
        let params = null;
        const MaxTimeIntervalRequest = config.mongodb.MaxTimeIntervalRequest * 24 * 60 * 60 * 1000;
        // Params definition
        let start;
        let end;
        if (req.query != null && req.query.start != null && req.query.end != null) {
            if (req.query.start > req.query.end) {
                logger.error({"Error": "Start date couldn't be before end date", "Code": 412});
                return response.status(412).send("Start date couldn't be before end date");
            } else if (req.query.end - req.query.start > MaxTimeIntervalRequest) {
                logger.error({
                    "Error": "[start date - end date] interval could not exceed " + config.mongodb.MaxTimeIntervalRequest + " months.",
                    "Code": 413
                });
                return response.status(413).send("[start date - end date] interval could not exceed " + config.mongodb.MaxTimeIntervalRequest + " months.");
            } else {
                start = Number(req.query.start);
                end = Number(req.query.end);
                params = {time: {$gte: start, $lte: end}};
            }
        }
        if (req.query != null && req.query.start != null && req.query.end == null) {
            start = Number(req.query.start);
            end = Number(req.query.start) + MaxTimeIntervalRequest;
            params = {time: {$gte: start, $lte: end}};
        }
        if (req.query != null && req.query.start == null && req.query.end != null) {
            start = Number(req.query.end) - MaxTimeIntervalRequest;
            end = Number(req.query.end);
            params = {time: {$lte: end, $gte: start}};
        }
        if (req.query.start == null && req.query.end == null) {
            params = {time: {$gte: moment().valueOf() - MaxTimeIntervalRequest}};
        }
        if (params) {
            this.ctrl.find(params, (err, docs) => {
                if (err) {
                    logger.error(err);
                    return response.status(err.code || 500).send('Internal error');
                } else {
                    logger.info({"Response": "Ok", "Code": 200});
                    this.sensorsConfigCtrl.allPromise().then(sensorsList => {
                        const dataToSend = {};
                        sensorsList.forEach((sensor) => {
                            dataToSend[sensor.id] = docs.filter((data) => data.sensorid === sensor.id).map((data) => {
                                return {time: data.time, value: data.value}
                            }).sort((a,b) => {
                                if(a.time > b.time) return 1;
                                if(a.time < b.time) return -1;
                                return 0;
                            });
                            return dataToSend;
                        });
                        return response.status(200).send(dataToSend);
                    }).catch(err => {
                        logger.error(err);
                        return response.status(500).send("Internal error, impossible to return sensor data");
                    });
                }
            });
        } else {
            logger.error({"Error": "Internal error, impossible to return sensor data", "Code": 500});
            return response.status(500).send("Internal error, impossible to return sensor data");
        }
    }
}

module.exports = SensorData;
