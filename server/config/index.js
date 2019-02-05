module.exports = {
  port : process.env.PORT || 3000,
  host : process.env.HOST || 'localhost',
  mongodb : {
    host 		: process.env.MONGO_HOST || '127.0.0.1',
    user 		: process.env.MONGO_USER || null,
    password 	: process.env.MONGO_PASSWORD || null,
    port 		: process.env.MONGO_PORT || '27017',
    dbName 		: process.env.MONGO_DBNAME || 'greenhouse'
  },
  sendgrid: {
    apiKey: process.env.SENDGRID_APIKEY || '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'
  }
};
