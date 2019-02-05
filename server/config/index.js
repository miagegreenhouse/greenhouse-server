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
    // apiKey: process.env.SENDGRID_APIKEY || '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'
  }
};
