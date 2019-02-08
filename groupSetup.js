const mongoose = require('mongoose');
const mongooseProvider = require('./server/mongooseProvider');
const config = require('./server/config');
const SensorsGroupController = require('./server/entities/sensorsgroup/controller');
const SensorsConfigController = require('./server/entities/sensorsconfig/controller');

mongooseProvider(config.mongodb.host, config.mongodb.port, config.mongodb.dbName, config.mongodb.user, config.mongodb.password, (err, res) => {
    if (err) {
        console.log("Shit happens");
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
            promises.push(sensorsGroupCtrl.insertPromise({name : doc.sensor}));

        });
        Promise.all(promises).then((data) => {
            console.log(`Data inserted : ${promises.length} groups created`);
        })
    })

}


