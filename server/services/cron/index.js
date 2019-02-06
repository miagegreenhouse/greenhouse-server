const influxProvider = require('../../influxProvider');
const config = require('../../config/index');
const cron = require('node-cron');
const request = require('request');
const moment = require('moment');
const SensorsDataController = require('../../entities/sensorsdata/controller');
const SensorsNameController = require('../../entities/sensorsname/controller');
const logger = require("../../logger");
const messaging = require('../messaging');

module.exports = function (mongoDb) {
    logger.info("Running Cron Task");
    startTask(mongoDb);
    cron.schedule(config.cron.pattern, () => {
        startTask(mongoDb);
    }, {
        scheduled: true,
    }).start();
};

const DataSourceEnum = Object.freeze({MyFood: 0, influxDb: 1});

const influxDb = influxProvider(config.influx.DATABASE_HOST, config.influx.DATABASE_PORT, config.influx.DATABASE_NAME, config.influx.DATABASE_USER, config.influx.DATABASE_PASSWORD);

function createNewSensors(sensorsNameCtrl, entry, dataSource) {
    return new Promise((resolve, reject) => {
        let entity = {
            dataSource: dataSource,
            sensorName: entry.sensor,
            unit: "",
            active: true
        };
        if (dataSource === DataSourceEnum.MyFood) entity.sensor = entry.sensor;
        else if (dataSource === DataSourceEnum.influxDb) entity.sensor = entry.series;

        if (entity.sensor) sensorsNameCtrl.insertPromise(entity).then((result) => resolve(result, entry)).catch((err) => reject(err));
        else reject('Error while adding a new sensor')
    });
}

function influxTaskCron(sensorsNameCtrl, sensorsDataCtrl, sensorsList, timestamp) {
    return new Promise((resolve, reject) => {
        const query = `select * from greenhouse_sensors where time > ${timestamp}`;
        influxDb.query(query).then(result => {
            if (result instanceof Array) {
                const dataToInsert = [];
                const promises = [];
                result.forEach((entry) => {
                    const sensor = sensorsList.find((sensor) => sensor.sensor === entry.sensor);
                    if (!sensor) {
                        promises.push(createNewSensors(sensorsNameCtrl, entry, DataSourceEnum.influxDb))
                    } else {
                        dataToInsert.push({
                            sensorid : sensor.id,
                            time: entry.time.getNanoTime(),
                            value: entry.value,
                            active: true
                        });
                    }
                });
                Promise.all(promises).then((array) => {
                    array.forEach((item) => {
                        const sensor = item[0];
                        const entry = item[1];
                        dataToInsert.push({
                            sensorid : sensor.id,
                            time: entry.time.getNanoTime(),
                            value: entry.value,
                            active: true
                        });
                    });
                }).catch((err) => reject(err));

            } else {
                const err = 'Error Influx Task Cron : incorrect response from influx database';
                logger.error(err);
                reject(new Error(err));
            }
        }).catch((err) => {
            reject(err);
        });
    });
}

function myFoodTaskCron(sensorsNameCtrl, sensorsDataCtrl, sensorsList, timestamp) {
    // Retrieve last value timestamp
    // Request data since last timestamp value
    return new Promise((resolve, reject) => {
        const requestOption = {
            method: 'GET',
            url: `https://hub.myfood.eu/opendata/productionunits/${config.MyFood.id}/measures`,
            encoding: null,
            headers:
                {
                    'Cache-Control': 'no-cache',
                    'Accept': 'application/json'
                },
        };
        try {
            request(requestOption, function (err, resp, body) {
                // Insert in MongoDB values
                if (body != null) {
                    const result = JSON.parse(Buffer.from(body.toJSON()).toString('utf8'));
                    if (result instanceof Array) {
                        const dataToInsert = result.map((entry) => {
                            return {
                                time: moment(entry.captureDate).valueOf(),
                                value: entry.value,
                            }
                        }).filter((entry) => entry.time > timestamp);
                        const promises = [];
                        dataToInsert.forEach((row) => {
                            promises.push(sensorsDataCtrl.insertPromise(row));
                        });
                        Promise.all(promises).then(() => {
                            logger.info(`New MyFood data inserted into mongodb : ${promises.length} new rows since ${moment(timestamp / 1000000).format()}`);
                            resolve(dataToInsert)
                        }).catch((err) => {
                            reject(err)
                        });
                    } else {
                        logger.error('Response body is undefined, ' + err);
                    }
                } else {
                    const err = 'Error MyFood Task Cron : incorrect response from MyFood API';
                    logger.error(err);
                    reject(new Error(err))
                }
            });
        } catch (err) {
            reject(err)
        }
    });
}

function updateWebSocket(datasources) {
    logger.info(`Starting to update webSockets`);
    if (messaging.connections.length > 0) {
        const promises = [];
        messaging.connections.forEach((connection) => {
            promises.push(messaging.send(connection.socket, datasources));
        });
        Promise.all(promises).then(() => {
            logger.info(`New data sended to ${messaging.connections.length} clients instances`);
            resolve(datasources);
        }).catch((err) => {
            reject(err)
        });
    }
}

function startTask(mongoDb) {
    const sensorsDataCtrl = new SensorsDataController(mongoDb);
    const sensorsNameCtrl = new SensorsNameController(mongoDb);
    let promises = [];
    promises.push(sensorsNameCtrl.allPromise());
    promises.push(sensorsDataCtrl.getLastTimeStamp());
    Promise.all(promises).then((result) => {
        promises = [];
        promises.push(influxTaskCron(sensorsNameCtrl, sensorsDataCtrl, result[0], result[1]));
        // promises.push(myFoodTaskCron(sensorsNameCtrl, sensorsDataCtrl, result[0], result[1]));
        Promise.all(promises).then((dataSources) => {
            const total = dataSources.map((dataSource) => dataSource.length).reduce((a, b) => a + b, 0);
            logger.info(`Success Cron Task : Total of ${total} new rows since ${moment(result[1] / 1000000).format()}`);
            updateWebSocket(dataSources)
        }).catch((err) => {
            logger.error('Error Task Cron', err);
        });
    });
}
