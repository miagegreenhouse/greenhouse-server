"use strict";
const mongoose = require('mongoose');
const _ = require('underscore');
const BaseFields = require('../BaseFields');

const fields = _.extend(_.clone(BaseFields), {
    sensorid: {type: String, required: true},
    time: {type: Number, required: false, default : null},
    value: {type: Number, required: false, default: null},
    active: {type: Boolean, required: false, default: true}
});

const schema = new mongoose.Schema(fields);

module.exports = function (mongoose) {
    return mongoose.model('sensorsdata', schema);
};
