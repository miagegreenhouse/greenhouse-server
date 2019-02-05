"use strict";

const mongoose = require('mongoose');

const SystemFields = {
	createdDate      : { type: Date, default: Date.now, set: function (val) { return this.createdDate; } },
	lastModifiedDate : { type: Date, default: Date.now },
	active 					 : { type: Boolean, default: true },
};

module.exports = SystemFields;
