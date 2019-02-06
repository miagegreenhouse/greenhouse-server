module.exports = {
  port : process.env.PORT || 3000,
  host : process.env.HOST || 'localhost',
  cron : {
    pattern : '*/15 * * * *'
  },
  MyFood : {
    id : 72
  },
  mongodb : {
    host 		: process.env.MONGO_HOST || '127.0.0.1',
    user 		: process.env.MONGO_USER || null,
    password 	: process.env.MONGO_PASSWORD || null,
    port 		: process.env.MONGO_PORT || '27017',
    dbName 		: process.env.MONGO_DBNAME || 'greenhouse'
  },
  influx : {
    DATABASE_PORT : process.env.INFLUX_DATABASE_PORT || 8086,
    DATABASE_NAME :  process.env.INFLUX_DATABASE_NAME || "greenhouse",
    DATABASE_HOST : process.env.INFLUX_DATABASE_HOST || "localhost",
    DATABASE_USER : process.env.INFLUX_DATABASE_USER || "",
    DATABASE_PASSWORD : process.env.INFLUX_DATABASE_PASSWORD || "",
    DATABASE_MEASURMENT : process.env.INFLUX_DATABASE_MEASURMENT || "greenhouse_sensors"
  },
  sendgrid: {
    // apiKey: process.env.SENDGRID_APIKEY || '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'
  }
};
