const express = require('express');
const router = express.Router();
const fs = require('fs');
const csv_parser = require("csv-parser");
const database = require('../databases/influx');
const env = require('../environnement/env');


function insert_data_into_influxDb(data) {

}

router.get('/populate', async function (req, res, next) {
    const data = [];
    fs.createReadStream('./fixtures/25_10_2018 grafana_data_export.csv' )
        .pipe(csv_parser())
        .on('data', (chunk) => {
            data.push(chunk)
        })
        .on('end', () => {
            insert_data_into_influxDb(data)
        })
});


module.exports = router;
