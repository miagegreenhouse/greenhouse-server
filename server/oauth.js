"use strict";

const oauthserver = require('node-oauth2-server');

module.exports = function(db) {

	const Local_oauth = require('./authentication');
	const local_oauth = new Local_oauth(db);

	return {
		server: oauthserver({
		  model: local_oauth,
		  accessTokenLifetime: 2678400,
		  grants: ["password"],
		  debug: true
		}),
		local: local_oauth
	};
};
