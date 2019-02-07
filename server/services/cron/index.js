const influxProvider = require('../../influxProvider');
const config = require('../../config/index');
const request = require('request');
const moment = require('moment');
const SensorsDataController = require('../../entities/sensorsdata/controller');
const SensorsNameController = require('../../entities/sensorsname/controller');
const logger = require("../../logger");
const messaging = require('../messaging');

module.exports = function (mongoDb) {
    logger.info("Running Cron Task");
    startTask(mongoDb);
    setInterval(() => {
        logger.info("Running Cron Task");
        startTask(mongoDb)
    }, config.cron.timer * 60 * 1000);
};

const DataSourceEnum = Object.freeze({MyFood: 0, influxDb: 1});
const MessageTypeEnum = Object.freeze({DATA: 'data', ALERT: 'alert'});

const influxDb = influxProvider(config.influx.DATABASE_HOST, config.influx.DATABASE_PORT, config.influx.DATABASE_NAME, config.influx.DATABASE_USER, config.influx.DATABASE_PASSWORD);

function createNewSensors(sensorsNameCtrl, entry, dataSource, sensorsList) {
    return new Promise((resolve, reject) => {
        let entity = {
            dataSource: dataSource,
            unit: "",
            active: true
        };
        if (dataSource === DataSourceEnum.MyFood) {
            entity.sensor = entry.sensor;
            entity.sensorName = entry.sensor;
        } else if (dataSource === DataSourceEnum.influxDb) {
            entity.sensor = entry.series;
            entity.sensorName = entry.series;
        }
        if (entity.sensor) {
            sensorsList.push(entity);
            sensorsNameCtrl.insertPromise(entity)
                .then((result) => resolve({result, entry}))
                .catch((err) => reject(err));
        } else reject('Error while adding a new sensor')
    });
}

function influxTaskCron(sensorsNameCtrl, sensorsDataCtrl, sensorsList, timestamp) {
    return new Promise((resolve, reject) => {
        const query = `select * from greenhouse_sensors where time > ${timestamp}`;
        influxDb.query(query).then(result => {
            if (result instanceof Array) {
                let dataToInsert = [];
                let promises = [];
                result.forEach((entry) => {
                    //find sensor object in database
                    const sensor = sensorsList.find((sensor) => sensor.sensor === entry.series
                        && sensor.dataSource === DataSourceEnum.influxDb);
                    if (!sensor) {
                        // if sensor do not exist, create new entry in database
                        promises.push(createNewSensors(sensorsNameCtrl, entry, DataSourceEnum.influxDb, sensorsList))
                    } else {
                        dataToInsert.push({
                            sensorid: sensor.id, // can be undefined if a sensor is not inserted yet
                            sensor: entry.series, // property used for data reprocessing, will be cleaned
                            time: entry.time.getNanoTime(),
                            value: entry.value,
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
                            time: entry.time.getNanoTime(),
                            value: entry.value,
                            active: true
                        });
                        dataToInsert = dataToInsert.map((sensor) => {
                            if (sensor.sensorid === undefined && sensor.sensor === databaseSensor.sensor) {
                                sensor.sensorid = databaseSensor.id
                            }
                            return sensor;
                        });
                        const sensor = sensorsList.find((sensor) => sensor.sensor === entry.series
                            && sensor.dataSource === DataSourceEnum.influxDb);
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
                        if (newSensorCount) logger.info(`New sensors inserted from influxDb into mongodb : ${newSensorCount} new rows since ${moment(timestamp / 1000000).format()}`);
                        if (promises.length) logger.info(`New InfluxDb data inserted into mongodb : ${promises.length} new rows since ${moment(timestamp / 1000000).format()}`);
                        resolve(dataToInsert)
                    }).catch((err) => reject(err));
                }).catch((err) => reject(err));
            } else {
                const err = 'Error Influx Task Cron : incorrect response from influx database';
                logger.error(err);
                reject(new Error(err));
            }
        }).catch((err) => reject(err));
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
                    let dataToInsert = [];
                    let promises = [];
                    const result = JSON.parse(Buffer.from(body.toJSON()).toString('utf8'));
                    if (result instanceof Array) {
                        result.forEach((entry) => {
                            entry.time = moment(entry.captureDate).valueOf() * 1000000;
                            if (entry.time > timestamp) {
                                //find sensor object in database
                                const sensor = sensorsList.find((sensor) => sensor.sensor === entry.sensor
                                    && sensor.dataSource === DataSourceEnum.MyFood);
                                if (!sensor) {
                                    // if sensor do not exist, create new entry in database
                                    promises.push(createNewSensors(sensorsNameCtrl, entry, DataSourceEnum.MyFood, sensorsList))
                                } else {
                                    dataToInsert.push({
                                        sensorid: sensor.id, // can be undefined if a sensor is not inserted yet
                                        sensor: entry.sensor, // property used for data reprocessing, will be cleaned
                                        time: entry.time,
                                        value: entry.value,
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
                                    value: entry.value,
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
                                if (newSensorCount) logger.info(`New sensors inserted from MyFood into mongodb : ${newSensorCount} new rows since ${moment(timestamp / 1000000).format()}`);
                                if (promises.length) logger.info(`New MyFood data inserted into mongodb : ${promises.length} new rows since ${moment(timestamp / 1000000).format()}`);
                                resolve(dataToInsert)
                            }).catch((err) => reject(err));
                        }).catch((err) => reject(err));
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

function updateWebSocket(dataSources, sensorsList) {
    logger.info(`Starting to update webSockets`);
    if (messaging.connections.length > 0) {
        logger.info('Number of connections', messaging.connections.length);

        const data = dataSources.reduce((acc,next) => acc.concat(next));
        const dataToSend = sensorsList.map((sensor) => {
            const result = {};
            const id = sensor.id;
            result[id] = data.filter((data) => data.sensorid === id).map((data) => { return {time : data.time, value : data.value}  });
            return result;
        }).filter((data) => data[Object.keys(data)[0]].length);

        messaging.broadcast(MessageTypeEnum.DATA, dataToSend);
    }
}

function startTask(mongoDb) {
    const sensorsDataCtrl = new SensorsDataController(mongoDb);
    const sensorsNameCtrl = new SensorsNameController(mongoDb);
    let promises = [];
    promises.push(sensorsNameCtrl.allPromise());
    promises.push(sensorsDataCtrl.getLastTimeStamp());
    Promise.all(promises).then((result) => {
        const sensorList = result[0];
        const timestamps = result[1];
        promises = [];
        promises.push(influxTaskCron(sensorsNameCtrl, sensorsDataCtrl, sensorList, timestamps));
        promises.push(myFoodTaskCron(sensorsNameCtrl, sensorsDataCtrl, sensorList, timestamps));
        Promise.all(promises).then((dataSources) => {
            const total = dataSources.map((dataSource) => dataSource.length).reduce((a, b) => a + b, 0);
            if (total) {
                logger.info(`Success Cron Task : Total of ${total} new data since ${moment(timestamps / 1000000).format()}`);
                updateWebSocket(dataSources,sensorList)
            }
        }).catch((err) => logger.error('Error Task Cron', err));
    });
}
