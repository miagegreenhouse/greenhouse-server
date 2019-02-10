"use strict";
const mongoose = require('mongoose');
const _ = require('underscore');
const BaseFields = require('../BaseFields');

const fields = _.extend(_.clone(BaseFields), {
    sensor: {type: String, required: true},
    dataSource: {type: Number, required: true},
    unit: {type: String, required: false, default : ""},
    sensorName: {type: String, required: false, default : null},
    active: {type: Boolean, required: false, default: true},
    minThresholdValue: Number,
    minThresholdAlertMessage: String,
    maxThresholdValue: Number,
    maxThresholdAlertMessage: String
});

const schema = new mongoose.Schema(fields);

module.exports = function (mongoose) {
    return mongoose.model('sensorsconfig', schema);
};