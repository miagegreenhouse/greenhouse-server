const influxProvider = require('../../influxProvider');
const config = require('../../config/index');
const cron = require('node-cron');
const request = require('request');
const SensorsDataController = require('../../entities/sensorsdata/controller');

const DataSourceEnum = Object.freeze({myfood:1, influxdb:2})

const influxDb = influxProvider(config.influx.DATABASE_HOST, config.influx.DATABASE_PORT, config.influx.DATABASE_NAME, config.influx.DATABASE_USER, config.influx.DATABASE_PASSWORD)

function influxTaskCron(mongoDb) {
    const sensorsdata = new SensorsDataController(mongoDb);
    sensorsdata.getLastTimeStamp().then((timestamp) => {
        const query = `select * from greenhouse_sensors where time > ${timestamp}`;
        influxDb.query(query).then(result => {
            if(result instanceof Array) {
                const dataToInsert = result.map( (entry) => {
                    return {sensor : entry.series, time : entry.time.getNanoTime(), value : entry.value, datasource : DataSourceEnum.influxdb, active : true}
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
  // Retrieve last value timestamp
  console.log('myFoodTaskCron')
  const sensorsdata = new SensorsDataController(mongoDb);
  sensorsdata.getLastTimeStamp().then((timestamp) => {
    // Request data since last timestamp value
    const requestOption = {
      method: 'GET',
      url: 'https://hub.myfood.eu/opendata/productionunits/72/measures',
      encoding: null,
      headers:
        {
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json'
        },
    };
    console.log('******************')
    request(requestOption, function (err, resp, body) {
      // Insert in MongoDB values
      const result = body.toJSON()
      console.log('Body', body.toJSON())
      if(result instanceof Array) {
          const dataToInsert = result.map( (entry) => {
            console.log(entry)
              return {sensor : entry.sensor, time : captureDate.captureDate.getNanoTime(), value : entry.value, datasource : DataSourceEnum.myfood, active : true}
          });
          const promises = [];
          dataToInsert.forEach((row) => {
              promises.push(sensorsdata.insertPromise(row));
          });
          Promise.all(promises).then(()=> {
              logger.info(`New MyFood data inserted into mongo : ${promises.length} new row since ${timestamp}`)
          });
      } else {
          logger.error('Error MyFood Task Cron : incorrect response from influx database')
      }
    }).catch((err) => {
      console.log('Error', err)
    })


  })
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
