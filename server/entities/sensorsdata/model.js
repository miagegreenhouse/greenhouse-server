"use strict";
const mongoose = require('mongoose');
const _ = require('underscore');
const BaseFields = require('../BaseFields');

const fields = _.extend(_.clone(BaseFields), {
    series: {type: String, required: true},
    time: {type: String, required: false, default : null},
    value: {type: String, required: false, default: null},
});

const schema = new mongoose.Schema(fields);

module.exports = function (mongoose) {
    return mongoose.model('sensorsdata', schema);
};
