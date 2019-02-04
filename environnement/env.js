module.exports = {
    port : 3000,
    influx : {
        DATABASE_PORT : process.env.INFLUX_DATABASE_PORT || 8086,
        DATABASE_NAME :  process.env.INFLUX_DATABASE_NAME || "greenhouse",
        DATABASE_HOST : process.env.INFLUX_DATABASE_HOST || "localhost",
        DATABASE_MEASURMENT : process.env.INFLUX_DATABASE_MEASURMENT || "greenhouse_sensors"
    }
};
