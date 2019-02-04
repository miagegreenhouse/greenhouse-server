const express = require('express');
const router = express.Router();
const database = require('../databases/influx').getDatabase();
const env = require('../environnement/env');


router.get('/populate', async function (req, res, next) {
    req.setTimeout(0);
    let data = require('../fixtures/fixtures');
    if (data instanceof Array) {
        data.forEach((entry) => {
            database.writePoints([
                {
                    measurement: env.influx.DATABASE_MEASURMENT,
                    tag_columns: {sensor: entry.series},
                    fields: {series: entry.series, time: entry.time, value: entry.value},
                }
            ]).catch(err => {
                console.error(`Error saving data to InfluxDB! ${err.stack}`)
            })
        });
        res.status(200).send('OK')
    }
    else res.status(500).send('Error')
});
router.get('/drop', async function (req, res, next) {
    database.query(`
    DROP DATABASE ${env.influx.DATABASE_NAME}
  `).then(result => {
        res.json(result)
    }).catch(err => {
        res.status(500).send(err.stack)
    });
});

router.get('/all', function (req, res) {
    const query = `select count(*) from greenhouse_sensors`;
    database.query(query).then(result => {
        res.json(result)
    }).catch(err => {
        res.status(500).send(err.stack)
    })
});

module.exports = router;
