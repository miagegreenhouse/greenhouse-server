const logger = require('./logger');
const Influx = require('influx');
const config = require('./config/index');
let influx = null;

module.exports = function(host, port, dbName, user, password) {
  if(influx != null) return influx;
  logger.info('DbURI: influxDb://'+ user + ':' + password + '@' +host+':'+port+'/'+dbName);
  influx = new Influx.InfluxDB({
    host: host,
    database: dbName,
    schema: DATABASE_SCHEMA,
    port: port,
    username : user,
    password : password
  });
  influx.getDatabaseNames().then((names) => {
    if (!names.includes(dbName)) return influx.createDatabase(dbName);
  }).then(() => {
    logger.info('InfluxDB successfully connected');
  }).catch(err => {
    logger.error('InfluxDB error', err);
  });
  return influx
};
const DATABASE_SCHEMA = [
  {
    measurement: config.influx.DATABASE_MEASURMENT,
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
