'use strict';

const Controller = require('./controller');
const RouteBase = require('../base/routes');
const logger = require('../../logger');
const config = require('../../config/index');
const moment = require('moment');

class SensorsAlert extends RouteBase {

    constructor(db) {
        super(db);
        this.ctrl = new Controller(db);
    }

    put() {
        this.publicRouter.put('/', (req, res, next) => this.putHandler(req, res, next));
        this.router.put('/:id', (req, response, next) => { super.putHandler(req, response, next); });
    }

    getOne() {
        this.publicRouter.get('/:id', (req, response) => this.getOneHandler(req, response));
    }

    getOneHandler(req, response) {
        logger.info("GET " + req.originalUrl);
        this.ctrl.findOne({_id: req.params.id}, (err, doc) => {
            if (err) {
                logger.error(err);
                return response.status(err.code || 500).send("Error in database");
            } else {
                if (!doc) return response.status(404).send("Not found");
                return response.status(200).send({
                    _id: doc.id,
                    time: doc.time,
                    value: doc.value,
                    sensorid: doc.sensorid,
                    timestampAcknowledgment: doc.timestampAcknowledgment,
                    message: doc.message
                });
            }
        });
    }

    getHandle(req, res) {
        logger.info("GET " + req.originalUrl);
        this.ctrl.dao.find({},null, (err, docs) => {
            if(err){
                logger.error(err);
                return res.status(500).send("Error in database");
            }
            if (!docs) return res.status(404).send("Not found");
            return res.status(200).send(docs.map((doc) => {
                return {
                    id: doc.id,
                    sensorid: doc.sensorid,
                    value: doc.value,
                    time: doc.time,
                    timestampAcknowledgment : doc.timestampAcknowledgment,
                    message: doc.message
                }
            }));
        }).limit(config.alerts.maxHistory);
    }

    putHandler(req, res) {
        logger.info("PUT " + req.originalUrl);
        const alertId = req.body.alertid;
        const token = req.body.token;
        this.ctrl.findOnePromise({_id: alertId, token: null}).then(alert => {
            if (alert && alert.tokens.find(t => t.token === token)) {
                alert.timestampAcknowledgment = moment().valueOf();
                alert.token = token;
                this.ctrl.updatePromise(alert).then(doc => {
                    res.status(200).send(doc.ok === 1)
                }).catch(err => {
                    logger.error(err);
                    res.status(500).send("Error in database");
                });
            } else if (!alert) res.status(404).send("Not found");
            else res.status(401).send("Not authorized");
        }).catch(err => {
            logger.error(err);
            res.status(500).send("Error in database");
        });
    }
}

module.exports = SensorsAlert;
