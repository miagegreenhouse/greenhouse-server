"use strict";
const mongoose = require('mongoose');
const _ = require('underscore');
const BaseFields = require('../BaseFields');

const fields = _.extend(_.clone(BaseFields), {
    sensorid: {type: String, required: true, default : null},
    time: {type: String, required: true, default : null},
    value: {type: Number, required: true, default : null},
    tokens: {type: Object, required: true, default : null},
    token: {type: String, required: false, default : null},
});

const schema = new mongoose.Schema(fields);

module.exports = function (mongoose) {
    return mongoose.model('sensorsalert', schema);
};
