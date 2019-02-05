const influxProvider = require('../../influxProvider');
const config = require('../../config/index');
const cron = require('node-cron');
const request = require('request');
const moment = require('moment');
const SensorsDataController = require('../../entities/sensorsdata/controller');
const logger = require("../../logger");


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

function influxTaskCron(sensorsDataCtrl, timestamp) {
    return new Promise((resolve, reject) => {
        const query = `select * from greenhouse_sensors where time > ${timestamp}`;
        influxDb.query(query).then(result => {
            if (result instanceof Array) {
                const dataToInsert = result.map((entry) => {
                    return {
                        sensor: entry.series,
                        time: entry.time.getNanoTime(),
                        value: entry.value,
                        dataSource: DataSourceEnum.influxDb,
                    }
                });
                const promises = [];
                dataToInsert.forEach((row) => {
                    promises.push(sensorsDataCtrl.insertPromise(row));
                });
                Promise.all(promises).then(() => {
                    logger.info(`New influxDb data inserted into mongodb : ${promises.length} new rows since ${moment(timestamp/1000000).format()}`)
                    resolve(dataToInsert);
                }).catch((err) => {
                    reject(err)
                });
            } else {
                const err = 'Error Influx Task Cron : incorrect response from influx database';
                logger.error(err);
                reject(new Error(err))
            }
        }).catch((err) => {
            reject(err)
        });
    });
}

function myFoodTaskCron(sensorsDataCtrl, timestamp) {
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
                const result = JSON.parse(Buffer.from(body.toJSON()).toString('utf8'));
                if (result instanceof Array) {
                    const dataToInsert = result.map((entry) => {
                        return {
                            sensor: entry.sensor,
                            time: moment(entry.captureDate).unix() * 1000000,
                            value: entry.value,
                            dataSource: DataSourceEnum.MyFood,
                        }
                    }).filter((entry) => entry.time > timestamp);
                    const promises = [];
                    dataToInsert.forEach((row) => {
                        promises.push(sensorsDataCtrl.insertPromise(row));
                    });
                    Promise.all(promises).then(() => {
                        logger.info(`New MyFood data inserted into mongodb : ${promises.length} new rows since ${moment(timestamp/1000000).format()}`);
                        resolve(dataToInsert)
                    }).catch((err) => {
                        reject(err)
                    });
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
}

function startTask(mongoDb) {
    const sensorsDataCtrl = new SensorsDataController(mongoDb);
    sensorsDataCtrl.getLastTimeStamp().then((timestamp) => {
        const promises = [];
        promises.push(influxTaskCron(sensorsDataCtrl, timestamp));
        promises.push(myFoodTaskCron(sensorsDataCtrl, timestamp));
        Promise.all(promises).then((datasources) => {
            const total = datasources.map((datasource) => datasource.length).reduce((a, b)=> a + b,0);
            logger.info(`Success Cron Task : Total of ${total} new rows since ${moment(timestamp/1000000).format()}`);
            updateWebSocket(datasources)
        }).catch((err) => {
            logger.error('Error Task Cron', err);
        });
    });
}

