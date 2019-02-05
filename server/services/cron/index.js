const influxProvider = require('../../influxProvider');
const config = require('../../config/index');
const cron = require('node-cron');
const SensorsDataController = require('../../entities/sensorsdata/controller');

enum DataSource = {
    myfood,
    influxdb
};

const influxDb = influxProvider(config.influx.DATABASE_HOST, config.influx.DATABASE_PORT, config.influx.DATABASE_NAME, config.influx.DATABASE_USER, config.influx.DATABASE_PASSWORD)

function influxTaskCron(mongoDb) {
    const sensorsdata = new SensorsDataController(mongoDb);
    sensorsdata.getLastTimeStamp().then((timestamp) => {
        const query = `select * from greenhouse_sensors where time > ${timestamp}`;
        influxDb.query(query).then(result => {
            if(result instanceof Array) {
                const dataToInsert = result.map( (entry) => {
                    return {sensor : entry.series, time : entry.time.getNanoTime(), value : entry.value, active : true}
                });
                const promises = [];
                dataToInsert.forEach((row) => {
                    promises.push(sensorsdata.insertPromise(row));
                });
                Promise.all(promises).then(()=> {
                    logger.info(`New influxDb data inserted into mongo : ${promises.length} new row since ${timestamp}`)
                });
            } else {
                logger.error('Error Influx Task Cron : incorrect response from influx database')
            }
        }).catch(err => {
            logger.error('Error Influx Task Cron', err)
        })
    })
}

function myFoodTaskCron(mongoDb) {

}

module.exports = function (mongoDb) {
    myFoodTaskCron(mongoDb);
    cron.schedule(`${config.cron.INTERVAL} * * * * *`, () => {
        // influxTaskCron(mongoDb);
        // myFoodTaskCron();
    }, {
        scheduled: true,
    }).start();
};
