const Influx = require('influx');
const env = require('../environnement/env');
const DATABASE_SCHEMA = [
    {
        measurement: env.influx.DATABASE_MEASURMENT,
        fields: {
            series: Influx.FieldType.STRING,
            time: Influx.FieldType.STRING,
            value: Influx.FieldType.STRING,
        },
        tags: [
            'sensor'
        ]
    }
];
let influx = null;

function getDatabase() {
    if(influx != null) return influx;
    influx = new Influx.InfluxDB({
        host: env.influx.DATABASE_HOST,
        database: env.influx.DATABASE_NAME,
        schema: DATABASE_SCHEMA,
        port: env.influx.DATABASE_PORT
    });

    influx.getDatabaseNames().then((names) => {
        if (!names.includes(env.influx.DATABASE_NAME)) return influx.createDatabase(env.influx.DATABASE_NAME);
    }).then(() => {
        console.log('InfluxDB connected')
    }).catch(err => {
        console.error(`Error creating Influx database!`, err);
    });
    return influx
}

module.exports.getDatabase = getDatabase;
