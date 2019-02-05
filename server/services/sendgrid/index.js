"use strict";

const sendgrid  = require('@sendgrid/mail');
const Q         = require('q');
const logger    = require('../../logger');

class SendGrid {

  constructor(config) {
    this.sendgrid = sendgrid;
    this.sendgrid.setApiKey(config.apiKey);
  }

  sendEmail(mail, cb) {
    if (typeof cb === 'function') {
      if (mail.to && mail.from && mail.subject && mail.text && mail.html) {
        this.sendgrid.send(mail)
          .then(() => {
            cb(null, 1);
          })
          .catch((err) => {
            cb(err);
          });
      } else {
        cb("Bad mail configuration object");
      }
    } else {
      logger.error("Bad callback in sendEmail function");
    }
  }

  sendEmailPromise(mail) {
    let q = Q.defer();
    this.sendEmail(mail, (err, res) => {
      if (err) q.reject(err);
      else q.resolve();
    });
    return q.promise;
  }

}

module.exports = SendGrid;
