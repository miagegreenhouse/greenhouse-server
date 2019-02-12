"use strict";

const mongoose = require('mongoose');
const logger = require('./logger');
const express = require('express');
const config = require('./config');
const request = require('request');
const path = require('path');
const json2csv = require('json2csv').Parser;
const userController = require('./entities/user/controller');
const dataController = require('./entities/sensorsdata/controller');
const configController = require('./entities/sensorsconfig/controller');
const moment = require('moment');


const userCtrl = new userController(mongoose);
const dataCtrl = new dataController(mongoose);
const configCtrl = new configController(mongoose);

module.exports = function (app, mongodb) {

    // app.use('/',                  express.static(path.join(__dirname, '../../greenhouse-app/www')));

    if (process.env.NAME === "production" || process.env.NAME === 'development') {
        logger.info("- local environment -");
        logger.info("setting up static files");
        app.use('/', express.static(path.join(__dirname, '../../greenhouse-app/www')));
    } else {
        app.get('/', (req, res, next) => {
            return res.status(200).send("OK");
        })
    }

    app.use((req, res, next) => {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Content-Length");
        return next();
    });

    app.use('/api', (req, res, next) => {
        if (req.method == "OPTIONS") {
            return res.status(200).send("GET,POST,PUT,DELETE");
        } else {
            next();
        }
    });

    logger.info("setting up authentication");

    // initialize authentication
    const oauth = require('./oauth')(mongodb);
    app.oauth = oauth.server;

    const Auth = require('./authentication');
    var auth = new Auth(mongodb);

    // app.all('/*', function(req, res, next) {
    //   if (req.originalUrl.indexOf('/api') === -1 && req.originalUrl.indexOf('/public') === -1) {
    //   // Just send the index.html for other files to support HTML5Mode
    //   res.sendFile(path.join(__dirname, '../../greenhouse-app/www/index.html'));
    //   } else {
    //     next();
    //   }
    // });

    app.all('/api/token', (req, response, next) => {
        logger.info("POST : " + req.originalUrl);
        if (!req.body.email) {
            return response.status(400).send({
                code: 400,
                message: "No email provided"
            });
        } else {
            var email = req.body.email;
        }
        if (!req.body.password) {
            return response.status(400).send({
                code: 400,
                message: "No password provided"
            });
        } else {
            var password = req.body.password;
        }

        if (email && password) {
            userCtrl.findOne({email: email}, (err, user) => {
                if (!user) {
                    logger.error({code: 404, message: "No user existing with this email"});
                    return response.status(404).send({code: 404, message: "No user existing with this email"});
                } else {
                    userCtrl.connect({"email": email, "password": password}, (err, user) => {
                        if (err) {
                            logger.error({"code": err.code || 500});
                            return response.status(err.code || 500).send(err);
                        } else if (!user) {
                            logger.error({code: 400, message: "Wrong password, please try again"});
                            return response.status(400).send({code: 400, message: "Wrong password, please try again"});
                        } else {
                            request({
                                url: 'http://' + config.host + ':' + config.port + '/oauth/token',
                                method: 'POST',
                                headers: {
                                    "Content-Type": "application/x-www-form-urlencoded"
                                },
                                body: "grant_type=password&username=" + encodeURIComponent(req.body.email) + "&password=" + encodeURIComponent(req.body.password) + "&client_id=greenhouse_client_id&client_secret=greenhouse_client_secret"
                            }, (err, res) => {
                                if (err) return response.status(err.code || 500).send(err);
                                else {
                                    try {
                                        var body = JSON.parse(res.body);
                                        if (body && typeof body === "object" && body !== null) {
                                            return response.status(res.statusCode).send(body);
                                        } else {
                                            return response.status(res.statusCode).send({"message": res.body});
                                        }
                                    } catch (e) {
                                        return response.status(res.statusCode).send({"message": res.body});
                                    }
                                }
                            });
                        }
                    });
                }
            });
        }
    });

    app.post("/oauth/activate", (req, res, next) => {
        logger.info("POST : " + req.originalUrl);
        auth.isActivated((err, activated) => {
            if (err) logger.error(err);
            else {
                if (!activated) {
                    auth.activate({
                        client_id: "greenhouse_client_id",
                        client_secret: "greenhouse_client_secret"
                    }, (err, client) => {
                        if (err) logger.error(err);
                        else {
                            logger.info("oauth successfully activated");
                            res.status(200).send(client);
                        }
                    });
                } else {
                    logger.info("oauth already activated");
                    res.status(200).send({code: 200, message: "oauth already activated"});
                }
            }
        });
    });

    request({
        url: 'http://' + config.host + ':' + config.port + '/oauth/activate',
        method: 'POST'
    }, (err, res) => {
        if (err) logger.error(err);
        else logger.info("oauth activated");
    });

    app.post("/oauth/token", app.oauth.grant());

    app.use('/api', (req, res, next) => {
        var authorizationHeader = req.get('authorization');
        if (authorizationHeader !== undefined && authorizationHeader !== null) {
            authorizationHeader = authorizationHeader.split(" ");
            if (authorizationHeader.length == 2) {
                logger.debug("authorization header: ");
                logger.debug(authorizationHeader);
                if (authorizationHeader[0] !== 'Bearer') {
                    logger.info("malformed auth header");
                    res.status(401).send({
                        code: 401,
                        message: 'Not authenticated (malformed auth header)'
                    });
                } else {
                    oauth.local.getUserFromToken(authorizationHeader[1], (err, user) => {
                        if (err) return res.status(err.code || 500).send(err);
                        if (!user) return res.status(401).send({code: 401, message: 'Not authenticated (bad token)'});
                        req.userId = user;
                        next();
                    });
                }
            } else {
                res.status(401).send({
                    code: 401,
                    message: 'Not authenticated (malformed auth header)'
                });
            }
        } else {
            res.status(401).send({
                code: 401,
                message: 'Not authenticated (no authorization header)'
            });
        }
    });

    app.use('/public', (req, res, next) => {
        next();
    });

    const Email = require('./services/sendgrid');

    app.post('/email', (req, res, next) => {
        var conf = {
            apiKey: config.sendgrid.apiKey
        };
        let email = new Email(conf);
        if (req.body) {
            var body = req.body;
            if (body.from && body.to && body.subject && body.text && body.html) {
                email.sendEmail(body, (err, results) => {
                    if (err) return res.status(500).send({code: 500, message: err});
                    return res.status(200).send({code: 200, message: "Mail sent !"});
                });
            } else {
                return res.status(400).send({code: 400, message: "Missing fields for sending a mail"});
            }
        }
    });

    app.get('/api/export', (req, res, next) => {
        res.setHeader('Content-disposition', `attachment; filename=${moment().format('YYYY-MM-DD HH:mm')}-export.csv`);
        res.set('Content-Type', 'text/csv');
        const promises = [];
        const start = Number(req.param('start'));
        const end = Number(req.param('end'));
        if(start && end && start > end) {
            logger.error({"Error": "Start date couldn't be before end date", "Code": 412});
            return res.status(412).send("Start date couldn't be before end date");
        }
        let params;
        switch (true) {
            case start && !end :
                params = {time: {$gte: start}};
                break;
            case !start && end:
                params = {time: {$lte: end}};
                break;
            case !start && !end:
                params = {};
                break;
            default:
                params = {time: {$gte: start, $lte: end}};
                break;
        }
        promises.push(dataCtrl.findPromise(params));
        promises.push(configCtrl.allPromise());
        Promise.all(promises).then((results) => {
            const docs = results[0];
            const sensors = results[1];
            const dataToSend = docs.sort((a,b) => {
                if(a.time > b.time) return 1;
                if(a.time < b.time) return -1;
                return 0;
            }).map((doc) => {
                const sensor = sensors.find(sensor => sensor.id === doc.sensorid);
                return {sensor : sensor.sensor, time:moment(doc.time).format(), value:doc.value, source : sensor.dataSource};
            });
            const fields = ['sensor', 'time', 'value', 'source'];
            const json2csvParser = new json2csv({ fields, quote: "", delimiter: config.export.delimiter });
            const csv = json2csvParser.parse(dataToSend);
            res.status(200).send(csv)
        }).catch(err => {
            logger.error(err);
            return res.status(500).send("Internal error, impossible to return export");
        });
    });


    const Main = require('./entities/main.router');
    const Public = require('./entities/public.router');

    const main = new Main(mongoose);
    const publicR = new Public(mongoose);

    app.use('/api', app.oauth.authorise(), main.router);
    app.use('/public', publicR.router);


};
