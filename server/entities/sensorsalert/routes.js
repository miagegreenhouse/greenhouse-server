'use strict';

const Controller = require('./controller');
const RouteBase = require('../base/routes');
const logger = require('../../logger');

class SensorsAlert extends RouteBase {

    constructor(db) {
        super(db);
        this.ctrl = new Controller(db);
    }

    get() {
        this.router.get('/', (req, res, next) => this.getHandler(req, res, next));
    }

    post() {
        this.router.post('/', (req, res, next) => this.postHandler(req, res, next));
    }

    getHandler(req, res) {
        logger.info("GET " + req.originalUrl);
        this.ctrl.findPromise({token: null}).then(alerts => {
            return res.status(200).send(alerts.map((doc)=>{
                return {id : doc.id, sensorid : doc.sensorid, value : doc.value, time: doc.time}
            }));
        }).catch(err => logger.error(err));
    }

    postHandler(req, res) {
        logger.info("GET " + req.originalUrl);
        // get alertid and set token in mongodb from request
    }
}

module.exports = SensorsAlert;
