"use strict";

const crypto = require("crypto");

class Authentication {
  constructor(db) {
    // db.connections[0] store the native mongodb connection needed by this class
    this.db = db.connections[0];
    this.authorizedClientIds = ['greenhouse_client_id'];
  }

  isActivated(cb) {
    this.db.collection('oauth_clients').findOne({client_id: "greenhouse_client_id", client_secret: "greenhouse_client_secret"}, (err, client) => {
      if (err) {
        return cb(err);
      } else {
        if (!client) {
          return cb(null, false);
        } else {
          return cb(null, true);
        }
      }
    });
  } 

  activate(obj, cb) {
    this.db.collection('oauth_clients').insert({client_id: obj.client_id, client_secret: obj.client_secret}, (err, client) => {
      if (err) {
        return cb(err);
      } else {
        return cb(null, client);
      }
    });
  }

  getAccessToken(bearerToken, callback) {
    this.db.collection('oauth_access_tokens').findOne({access_token : bearerToken}, (err, token) => {
      if (err || !token) return callback(err);
      // This object will be exposed in req.oauth.token
      // The user_id field will be exposed in req.user (req.user = { id: "..." }) however if
      // an explicit user object is included (token.user, must include id) it will be exposed
      // in req.user instead
      callback(null, {
        accessToken: token.access_token,
        clientId: token.client_id,
        expires: token.expires,
        userId: token.userId
      });
    });
  }

  getClient(clientId, clientSecret, callback) {
    this.db.collection('oauth_clients').findOne({client_id: clientId}, (err, client) => {
      if (err || !client) return callback(err);

      if (clientSecret !== null && client.client_secret !== clientSecret) return callback();

      // This object will be exposed in req.oauth.client
      callback(null, {
        clientId: client.client_id,
        clientSecret: client.client_secret
      });
    });
  }

  getRefreshToken(bearerToken, callback) {
    this.db.collection('oauth_refresh_tokens').findOne({refresh_token : bearerToken}, (err, result) => {
      // The returned user_id will be exposed in req.user.id
      callback(err, result.length > 0 ? result : false);
    });
  }

  grantTypeAllowed(clientId, grantType, callback) {
    if (grantType == 'password') {
      return callback(false, this.authorizedClientIds.indexOf(clientId.toLowerCase()) >= 0);
    }
    callback(false, true);
  }

  saveAccessToken(accessToken, clientId, expires, user, callback) {
    this.db.collection('oauth_access_tokens').insert({access_token : accessToken, client_id:clientId, user_id: user._id, expires: expires}, callback);
  }

  saveRefreshToken(refreshToken, clientId, expires, userId, callback) {
    this.db.collection('oauth_refresh_tokens').insert({refresh_token:refreshToken, client_id:clientId, user_id:userId, expires:expires});
  }

  /*
   * Required to support password grant type
   */
   getUser(username, password, callback) {
     this.db.collection('users').findOne({"email":username}, (err, user) => {
       if (!user) return callback(err, false);
       if (err) return callback(err);
       var hash = crypto.createHash('sha256').update(password + user.salt).digest('base64');
       this.db.collection('users').findOne({"email":username, password: hash}, (err, user) => {
         callback(err, user ? user : false);
       });
     });
  }

  getUserFromToken(token, callback) {
    this.db.collection('oauth_access_tokens').findOne({access_token:token}, (err, result) => {
      if (result !== undefined && result !== null) {
        callback(err, result.user_id);
      } else {
        callback(err, null);
      }
    });
  }

  getTokenByUserId(id, callback) {
    console.log(id);
    this.db.collection('oauth_access_tokens').findOne({user_id: id}, (err, result) => {
      console.log(result);
      if (result !== undefined && result !== null) {
        callback(err, result.access_token);
      } else {
        callback(err, null);
      }
    });
  }
}

module.exports = Authentication;
