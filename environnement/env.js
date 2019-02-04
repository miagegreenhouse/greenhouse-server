module.exports = {
    influx : {
        DATABASE_NAME :  process.env.INFLUX_DATABASE_NAME || "greenhouse",
        DATABASE_HOST : process.env.INFLUX_DATABASE_HOST || "localhost",
        DATABASE_MEASURMENT : process.env.INFLUX_DATABASE_MEASURMENT || "greenhouse_captors"
    }
};
