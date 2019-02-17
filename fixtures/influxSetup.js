const influxProvider = require('../server/influxProvider');
const config = require('../server/config/index');
const influxDb = influxProvider(config.influx.DATABASE_HOST, config.influx.DATABASE_PORT, config.influx.DATABASE_NAME, config.influx.DATABASE_USER, config.influx.DATABASE_PASSWORD);

function printTotalInfluxDb() {
    const query = `select count(*) from greenhouse_sensors`;
    influxDb.query(query).then(result => {
        console.log(`Total : ${result[0].count_series} row in influxDb.`);
    }).catch(err => {
    });
}

function main() {
    let data = require('./fixtures.json');
    if (data instanceof Array) {
        const promises = [];
        data.forEach((entry) => {
            promises.push(influxDb.writePoints([
                {
                    measurement: config.influx.DATABASE_MEASURMENT,
                    tag_columns: {sensor: entry.series},
                    fields: {series: entry.series, time: entry.time, value: entry.value},
                }
            ]));
        });
        Promise.all(promises)
            .then(_ => {
                printTotalInfluxDb();
            })
            .catch(err => {
                console.error(`Error saving data to InfluxDB! ${err.stack}`)
            });
    }
}

main();
