const influxProvider = require('../../influxProvider');
const config = require('../../config/index');
const cron = require('node-cron');
const request = require('request');
const logger = require('../../logger');
const moment = require('moment');

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
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8'
        },
    };
    request(requestOption, function (err, resp, body) {
      // Insert in MongoDB values
      const result = JSON.parse(Buffer.from(body.toJSON()).toString('utf8'));

      if(result instanceof Array) {
          const dataToInsert = result.map( (entry) => {
            if(moment(entry.captureDate).valueOf()>timestamp){
              console.log('Timestamp', timestamp)
              console.log('Moment', moment(entry.captureDate).valueOf())
              return {sensor : entry.sensor, time : moment(entry.captureDate).valueOf(), value : entry.value, datasource : DataSourceEnum.myfood, active : true}
            }
          });

          const promises = [];
          dataToInsert.forEach((row) => {
              promises.push(sensorsdata.insertPromise(row));
          });
          Promise.all(promises).then(()=> {
              logger.info(`New MyFood data inserted into mongo : ${promises.length} new row since ${timestamp}`)
          });
      } else {
          logger.error('Error MyFood Task Cron : incorrect response from MyFood database')
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
        myFoodTaskCron();
    }, {
        scheduled: true,
    }).start();
};
