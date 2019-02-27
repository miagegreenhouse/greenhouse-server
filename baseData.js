const mongoose = require('mongoose');
const mongooseProvider = require('./server/mongooseProvider');
const config = require('./server/config');
const SensorsGroupController = require('./server/entities/sensorsgroup/controller');
const SensorsConfigController = require('./server/entities/sensorsconfig/controller');

const Configs = [
  {
    sensor: "pH Sensor",
    sensorGroupIds: [],
    dataSource: 0,
    unit: "",
    sensorName: "pH Sensor",
    minThresholdValue: undefined,
    minThresholdAlertMessage: undefined,
    maxThresholdValue: undefined,
    maxThresholdAlertMessage: undefined,
  },
  {
    sensor: "Water Temperature Sensor",
    sensorGroupIds: [],
    dataSource: 0,
    unit: "°C",
    sensorName: "Water Temperature Sensor",
    minThresholdValue: 5,
    minThresholdAlertMessage: "Please plug the heater",
    maxThresholdValue: undefined,
    maxThresholdAlertMessage: undefined,
  },
  {
    sensor: "Air Temperature Sensor",
    sensorGroupIds: [],
    dataSource: 0,
    unit: "°C",
    sensorName: "Air Temperature Sensor",
    minThresholdValue: 20,
    minThresholdAlertMessage: "Please close the door",
    maxThresholdValue: 40,
    maxThresholdAlertMessage: "Please open the door",  
  },
  {
    sensor: "Air Humidity Sensor",
    sensorGroupIds: [],
    dataSource: 0,
    unit: "%",
    sensorName: "Air Humidity Sensor",
    minThresholdValue: 70,
    minThresholdAlertMessage: "Please open the door",
    maxThresholdValue: undefined,
    maxThresholdAlertMessage: undefined,  
  },
  {
    sensor: "External Air Temperature",
    sensorGroupIds: [],
    dataSource: 0,
    unit: "°C",
    sensorName: "External Air Temperature",
    minThresholdValue: undefined,
    minThresholdAlertMessage: undefined,
    maxThresholdValue: undefined,
    maxThresholdAlertMessage: undefined,  
  },
  {
    sensor: "External Air Humidity",
    sensorGroupIds: [],
    dataSource: 0,
    unit: "%",
    sensorName: "External Air Humidity",
    minThresholdValue: undefined,
    minThresholdAlertMessage: undefined,
    maxThresholdValue: undefined,
    maxThresholdAlertMessage: undefined,  
  },
  {
    sensor: "ruche-g2elab.S6",
    sensorGroupIds: [],
    dataSource: 1,
    unit: undefined,
    sensorName: "ruche-g2elab.S6",
    minThresholdValue: undefined,
    minThresholdAlertMessage: undefined,
    maxThresholdValue: undefined,
    maxThresholdAlertMessage: undefined,  
  },
  {
    sensor: "ruche-g2elab.S13",
    sensorGroupIds: [],
    dataSource: 1,
    unit: undefined,
    sensorName: "ruche-g2elab.S13",
    minThresholdValue: undefined,
    minThresholdAlertMessage: undefined,
    maxThresholdValue: undefined,
    maxThresholdAlertMessage: undefined,  
  },
  {
    sensor: "ruche-g2elab.S19",
    sensorGroupIds: [],
    dataSource: 1,
    unit: undefined,
    sensorName: "ruche-g2elab.S19",
    minThresholdValue: undefined,
    minThresholdAlertMessage: undefined,
    maxThresholdValue: undefined,
    maxThresholdAlertMessage: undefined,  
  },
  {
    sensor: "ruche-g2elab.S26",
    sensorGroupIds: [],
    dataSource: 1,
    unit: undefined,
    sensorName: "ruche-g2elab.S26",
    minThresholdValue: undefined,
    minThresholdAlertMessage: undefined,
    maxThresholdValue: undefined,
    maxThresholdAlertMessage: undefined,  
  }
];

mongooseProvider(config.mongodb.host, config.mongodb.port, config.mongodb.dbName, config.mongodb.user, config.mongodb.password, (err, res) => {
    if (err) {
        console.log("Connection to mongo has been broken");
    } else {
        setup(mongoose);
    }
});

function setup(db) {
    const sensorsConfigCtrl = new SensorsConfigController(db);
    let promises = [];
    Configs.forEach(sensorConfig => {
        promises.push(sensorsConfigCtrl.insertPromise(sensorConfig));
    });
    Promise.all(promises)
    .then(res => {
        console.log("Successfully created configs for data");
    })
    .catch(err => {
        console.error("Erreur", err);
    });
}


