module.exports = {
  port : process.env.PORT || 3000,
  host : process.env.HOST || 'localhost',
  cron : {
    timer : process.env.CRON_TIMER || 15 // Time in minutes
  },
  export : {
    delimiter:  process.env.EXPORT_DELIMITER || ';'
  },
  MyFood : {
    id : process.env.MYFOOD_ID || 109
  },
  mongodb : {
    host 		: process.env.MONGO_HOST || '127.0.0.1',
    user 		: process.env.MONGO_USER || null,
    password 	: process.env.MONGO_PASSWORD || null,
    port 		: process.env.MONGO_PORT || '27017',
    dbName 		: process.env.MONGO_DBNAME || 'greenhouse',
    MaxTimeIntervalRequest : process.env.MaxTimeIntervalRequest || 93 // Number of days
  },
  influx : {
    DATABASE_PORT : process.env.INFLUX_DATABASE_PORT || 8086,
    DATABASE_NAME :  process.env.INFLUX_DATABASE_NAME || "greenhouse",
    DATABASE_HOST : process.env.INFLUX_DATABASE_HOST || "localhost",
    DATABASE_USER : process.env.INFLUX_DATABASE_USER || "",
    DATABASE_PASSWORD : process.env.INFLUX_DATABASE_PASSWORD || "",
    DATABASE_MEASURMENT : process.env.INFLUX_DATABASE_MEASURMENT || "greenhouse_sensors"
  },
  alerts : {
    webAppBaseURI : process.env.ALERT_WEBAPPBASE_URI || 'http://localhost',
    from : process.env.ALERT_FROM ||'ne-pas-repondre@greenhouse.fr',
    maxHistory : process.env.ALERT_MAX_HISTORY || 100
  },
  sendgrid: {
    apiKey: process.env.SENDGRID_APIKEY || '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'
  }
};
