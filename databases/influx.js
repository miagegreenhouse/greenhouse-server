const Influx = require('influx');
const env = require('../environnement/env');
const DATABASE_SCHEMA = [
    {
        measurement: env.influx.DATABASE_MEASURMENT,
        fields: {
            path: Influx.FieldType.STRING,
            duration: Influx.FieldType.INTEGER
        },
        tags: [
            'sensor'
        ]
    }
];
module.exports.DATABASE_SCHEMA = DATABASE_SCHEMA;

const influx = new Influx.InfluxDB({
    host: env.influx.DATABASE_HOST,
    database: env.influx.DATABASE_NAME,
    schema: DATABASE_SCHEMA
});

influx.getDatabaseNames().then((names) => {
    if (!names.includes(env.influx.DATABASE_NAME)) return influx.createDatabase(env.influx.DATABASE_NAME);
}).then(() => {
    console.log('InfluxDB connected')
}).catch(err => {
    console.error(`Error creating Influx database!`, err);
});

module.exports = influx;
