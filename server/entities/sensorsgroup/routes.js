'use strict';

const Controller          = require('./controller');
const RouteBase           = require('../base/routes');
const SensorsConfigCtrl   = require('../sensorsconfig/controller');
const logger              = require('../../logger');

class SensorsGroup extends RouteBase {

  constructor(db) {
    super(db);
    this.ctrl               = new Controller(db);
    this.sensorsConfigCtrl  = new SensorsConfigCtrl(db);
  }

  get() {
    this.publicRouter.get('/', (req, res, next) => this.getHandle(req, res, next));
  }

  deleteOneHandler(req, response, next) {
    logger.info("DELETE " + req.originalUrl + " id: " + req.params.id + ")");
    if (req.docs.active === false) {
      logger.info({"code" : 200, "message" : "Document already deleted"});
      return response.status(200).send({"code" : 200, "message" : "Document already deleted"});
    } else {
      this.sensorsConfigCtrl.find({sensorGroupId: req.params.id}, (err, sensorsConfigs) => {
        if (err) {
          logger.error(err);
          return response.status(err.code || 500).send(err);
        }
        let promises = [];
        sensorsConfigs.forEach(sensorConfig => {
          sensorConfig.sensorGroupId = null;
          logger.info("Deleting group from sensor config : ", sensorConfig._id);
          promises.push(this.sensorsConfigCtrl.updatePromise(sensorConfig));
        });
        Promise.all(promises)
        .then(res => {
          this.ctrl.update({_id:req.docs._id.toString(), active:false}, (err, res) => {
            if (err) {
              logger.error(err);
              return response.status(err.code || 500).send(err);
            }
            logger.info({"response" : "ok", "code" : 200});
            return response.status(200).send(res);
          });
        })
        .catch(err => {
          logger.error(err);
          return response.status(err.code || 500).send(err);
        });
      });
    }
  }

}

module.exports = SensorsGroup;
