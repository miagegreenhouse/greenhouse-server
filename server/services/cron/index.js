const influxProvider = require('../../influxProvider');
const config = require('../../config/index');
const request = require('request');
const moment = require('moment');
const SensorsDataController = require('../../entities/sensorsdata/controller');
const SensorsConfigController = require('../../entities/sensorsconfig/controller');
const SensorsAlertController = require('../../entities/sensorsalert/controller');
const AdminMailController = require('../../entities/adminmail/controller');
const logger = require("../../logger");
const messaging = require('../messaging');
const crypto = require('crypto');


module.exports = function (mongoDb) {
    logger.info("Running Cron Task");
    startTask(mongoDb);
    setInterval(() => {
        logger.info("Running Cron Task");
        startTask(mongoDb)
    }, config.cron.timer * 60 * 1000);
};

const DataSourceEnum = Object.freeze({MyFood: 0, g2elab: 1});
const MessageTypeEnum = Object.freeze({DATA: 'data', ALERT: 'alert'});

function startTask(mongoDb) {
    const sensorsDataCtrl = new SensorsDataController(mongoDb);
    // todo remove
    sensorsDataCtrl.remove({}, () => {
    });
    const sensorsConfigCtrl = new SensorsConfigController(mongoDb);
    let promises = [];
    promises.push(sensorsConfigCtrl.allPromise());
    promises.push(sensorsDataCtrl.getLastTimeStamp());
    Promise.all(promises).then((result) => {
        const sensorList = result[0];
        const timestamps = Number(result[1]);
        promises = [];
        promises.push(g2elabTaskCron(sensorsConfigCtrl, sensorsDataCtrl, sensorList, timestamps));
        promises.push(myFoodTaskCron(sensorsConfigCtrl, sensorsDataCtrl, sensorList, timestamps));
        Promise.all(promises).then((dataSources) => {
            const total = dataSources.map((dataSource) => dataSource.length).reduce((a, b) => a + b, 0);
            if (total) {
                logger.info(`Success Cron Task : Total of ${total} new data since ${moment(timestamps).format()}`);
                const data = dataSources.reduce((acc, next) => acc.concat(next));
                updateWebSocket(data, sensorList);
                updateAlert(data, sensorList, mongoDb);
            }
        }).catch((err) => logger.error('Error Task Cron', err));
    });
}

const influxDb = influxProvider(config.influx.DATABASE_HOST, config.influx.DATABASE_PORT, config.influx.DATABASE_NAME, config.influx.DATABASE_USER, config.influx.DATABASE_PASSWORD);


function createNewSensors(sensorsConfigCtrl, entry, dataSource, sensorsList) {
    return new Promise((resolve, reject) => {
        let entity = {
            dataSource: dataSource,
            unit: "",
            minThresholdValue: null,
            minThresholdAlertMessage: "",
            maxThresholdValue: null,
            maxThresholdAlertMessage: "",
            active: true
        };
        if (dataSource === DataSourceEnum.MyFood) {
            entity.sensor = entry.sensor;
            entity.sensorName = entry.sensor;
        } else if (dataSource === DataSourceEnum.g2elab) {
            entity.sensor = entry.series;
            entity.sensorName = entry.series;
        }
        if (entity.sensor) {
            sensorsList.push(entity);
            sensorsConfigCtrl.insertPromise(entity)
                .then((result) => resolve({result, entry}))
                .catch((err) => reject(err));
        } else reject('Error while adding a new sensor')
    });
}

function g2elabTaskCron(sensorsConfigCtrl, sensorsDataCtrl, sensorsList, timestamp) {
    return new Promise((resolve, reject) => {
        const influxTimeStamp = timestamp * 1000000;
        const query = `select * from greenhouse_sensors where time > ${influxTimeStamp}`;
        influxDb.query(query).then(result => {
            if (result instanceof Array) {
                let dataToInsert = [];
                let promises = [];
                result.forEach((entry) => {
                    //find sensor object in database
                    const sensor = sensorsList.find((sensor) => sensor.sensor === entry.series
                        && sensor.dataSource === DataSourceEnum.g2elab);
                    if (!sensor) {
                        // if sensor do not exist, create new entry in database
                        promises.push(createNewSensors(sensorsConfigCtrl, entry, DataSourceEnum.g2elab, sensorsList))
                    } else {
                        dataToInsert.push({
                            sensorid: sensor.id, // can be undefined if a sensor is not inserted yet
                            sensor: entry.series, // property used for data reprocessing, will be cleaned
                            time: Math.trunc(entry.time.getNanoTime() / 1000000),
                            value: Number(entry.value.replace(",", ".")),
                            active: true
                        });
                    }
                });
                // data reprocessing
                const newSensorCount = promises.length;
                Promise.all(promises).then((array) => {
                    // array contains new sensors, dataToInsert need to be reprocess with correct database id
                    array.forEach((item) => {
                        const databaseSensor = item.result;
                        const entry = item.entry;
                        dataToInsert.push({
                            sensorid: databaseSensor.id,
                            time: Math.trunc(entry.time.getNanoTime() / 1000000),
                            value: Number(entry.value.replace(",", ".")),
                            active: true
                        });
                        dataToInsert = dataToInsert.map((sensor) => {
                            if (sensor.sensorid === undefined && sensor.sensor === databaseSensor.sensor) {
                                sensor.sensorid = databaseSensor.id
                            }
                            return sensor;
                        });
                        const sensor = sensorsList.find((sensor) => sensor.sensor === entry.series
                            && sensor.dataSource === DataSourceEnum.g2elab);
                        sensor.id = databaseSensor.id
                    });
                    // clean data used fo reprocessing
                    dataToInsert = dataToInsert.map((sensor) => {
                        delete sensor.series;
                        return sensor;
                    });
                    promises = [];
                    // data insertion
                    dataToInsert.forEach((row) => {
                        promises.push(sensorsDataCtrl.insertPromise(row));
                    });
                    // Success callback
                    Promise.all(promises).then(() => {
                        const date = moment(timestamp).format();
                        if (newSensorCount) logger.info(`New sensors inserted from G2E Lab influxDb into mongodb : ${newSensorCount} new rows since ${date}`);
                        if (promises.length) logger.info(`New G2E Lab InfluxDb data inserted into mongodb : ${promises.length} new rows since ${date}`);
                        resolve(dataToInsert)
                    }).catch((err) => reject(err));
                }).catch((err) => reject(err));
            } else {
                const err = 'Error Influx Task Cron : incorrect response from G2E Lab influx database';
                logger.error(err);
                reject(new Error(err));
            }
        }).catch((err) => reject(err));
    });
}

function myFoodTaskCron(sensorsConfigCtrl, sensorsDataCtrl, sensorsList, timestamp) {
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
                    let dataToInsert = [];
                    let promises = [];
                    const result = JSON.parse(Buffer.from(body.toJSON()).toString('utf8'));
                    if (result instanceof Array) {
                        result.forEach((entry) => {
                            entry.time = moment(entry.captureDate).valueOf();
                            if (entry.time > timestamp) {
                                //find sensor object in database
                                const sensor = sensorsList.find((sensor) => sensor.sensor === entry.sensor
                                    && sensor.dataSource === DataSourceEnum.MyFood);
                                if (!sensor) {
                                    // if sensor do not exist, create new entry in database
                                    promises.push(createNewSensors(sensorsConfigCtrl, entry, DataSourceEnum.MyFood, sensorsList))
                                } else {
                                    dataToInsert.push({
                                        sensorid: sensor.id, // can be undefined if a sensor is not inserted yet
                                        sensor: entry.sensor, // property used for data reprocessing, will be cleaned
                                        time: entry.time,
                                        value: Number(entry.value),
                                        active: true
                                    });
                                }
                            }
                        });
                        const newSensorCount = promises.length;
                        Promise.all(promises).then((array) => {
                            // array contains new sensors, dataToInsert need to be reprocess with correct database id
                            array.forEach((item) => {
                                const databaseSensor = item.result;
                                const entry = item.entry;
                                dataToInsert.push({
                                    sensorid: databaseSensor.id,
                                    time: entry.time,
                                    value: Number(entry.value),
                                    active: true
                                });
                                dataToInsert = dataToInsert.map((sensor) => {
                                    if (sensor.sensorid === undefined && sensor.sensor === databaseSensor.sensor) {
                                        sensor.sensorid = databaseSensor.id
                                    }
                                    return sensor;
                                });
                                const sensor = sensorsList.find((sensor) => sensor.sensor === entry.sensor
                                    && sensor.dataSource === DataSourceEnum.MyFood);
                                sensor.id = databaseSensor.id
                            });
                            // clean data used fo reprocessing
                            dataToInsert = dataToInsert.map((sensor) => {
                                delete sensor.sensor;
                                return sensor;
                            });
                            promises = [];
                            // data insertion
                            dataToInsert.forEach((row) => {
                                promises.push(sensorsDataCtrl.insertPromise(row));
                            });
                            // Success callback
                            Promise.all(promises).then(() => {
                                const date = moment(timestamp).format();
                                if (newSensorCount) logger.info(`New sensors inserted from MyFood into mongodb : ${newSensorCount} new rows since ${date}`);
                                if (promises.length) logger.info(`New MyFood data inserted into mongodb : ${promises.length} new rows since ${date}`);
                                resolve(dataToInsert)
                            }).catch((err) => reject(err));
                        }).catch((err) => reject(err));
                    } else {
                        logger.error('Response body is undefined, ' + err);
                    }
                } else {
                    const err = 'Error MyFood Task Cron : incorrect response from MyFood API';
                    reject(new Error(err))
                }
            });
        } catch (err) {
            reject(err)
        }
    });
}

function updateWebSocket(data, sensorsList) {
    if (messaging.connections.length > 0) {
        logger.info(`Starting to update webSockets`);
        logger.info('Number of connections', messaging.connections.length);

        const dataToSend = sensorsList.map((sensor) => {
            const result = {};
            const id = sensor.id;
            result[id] = data.filter((data) => data.sensorid === id).map((data) => {
                return {time: data.time, value: data.value}
            });
            return result;
        }).filter((data) => data[Object.keys(data)[0]].length);
        messaging.broadcast('message', {type: MessageTypeEnum.DATA, data: dataToSend});
        logger.info(`Success update of webSockets`);
    }
}


function updateAlert(data, sensorsConfigList, mongoDb) {
    const sensorsAlertCtrl = new SensorsAlertController(mongoDb);
    const adminMailCtrl = new AdminMailController(mongoDb);
    const valuesToCheck = [];
    sensorsConfigList.forEach(sensor => {
        valuesToCheck.push(data.filter(doc => {
                return !!(doc.sensorid === sensor.id && (sensor.minThresholdValue && doc.value <= sensor.minThresholdValue) ||
                    (sensor.maxThresholdValue && doc.value > sensor.maxThresholdValue));
        }));
    });

    adminMailCtrl.findPromise().then(mails => {
        valuesToCheck.forEach((values) => {
            const waitingInsertionAlert = [];
            values.forEach((value) => {
                if (waitingInsertionAlert.filter(sensorid => sensorid === value.sensorid).length === 0) {
                    const sensor = sensorsConfigList.find((sensor) => sensor.id === value.sensorid);
                    waitingInsertionAlert.push(sensor.id);
                    sensorsAlertCtrl.findOnePromise({sensorid: sensor.id, token: null}).then(alert => {
                        if (!alert) {
                            const tokens = mails.map((mail) => {
                                return {
                                    token: crypto.createHash('sha256').update(value.time + mail).digest('base64'),
                                    userId: mail.id
                                };
                            });
                            sensorsAlertCtrl.insertPromise({
                                sensorid: sensor.id,
                                time: value.time,
                                value: value.value,
                                tokens: tokens,
                                token: null
                            }).then(_ => sendAlertMail(sensor, value, mails))
                                .catch(err => logger.error('Error while inserting alert', err));
                        }
                    }).catch(err => logger.error('Error while inserting alert', err));
                }
            })
        });
    });

}

function sendAlertMail(sensor, value, email) {
    // todo send mail
    // console.log(sensor);
}
