const mongoose = require('mongoose');
const mongooseProvider = require('./server/mongooseProvider');
const config = require('./server/config');
const SensorsGroupController = require('./server/entities/sensorsgroup/controller');
const SensorsConfigController = require('./server/entities/sensorsconfig/controller');

mongooseProvider(config.mongodb.host, config.mongodb.port, config.mongodb.dbName, config.mongodb.user, config.mongodb.password, (err, res) => {
    if (err) {
        console.log("Connection to mongo has been broken");
    } else {
        setup(mongoose);
    }
});

function setup(db) {
    const sensorsConfigCtrl = new SensorsConfigController(db);
    const sensorsGroupCtrl = new SensorsGroupController(db);
    sensorsConfigCtrl.findPromise({}).then((docs) => {
        console.log('New groups ', docs.map(doc => doc.sensor));
        const promises = [];
        docs.forEach((doc) => {
            promises.push(new Promise((resolve, reject) => {
                sensorsGroupCtrl.insertPromise({name : doc.sensor.replace(' Sensor', '')}).then((group) => {
                    sensorsConfigCtrl.update({_id: doc._id, sensorGroupId: group._id}, (err, res) => {
                        if (err) reject(err);
                        else resolve(res);
                    });
                })
                .catch(err => console.error(err));
            }));
        });
        Promise.all(promises).then((data) => {
            console.log(`Data inserted : ${promises.length} groups created`);
        })
    })

}


