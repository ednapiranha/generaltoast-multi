var express = require('express');
var configurations = module.exports;
var app = express();
var server = require('http').createServer(app);
var nconf = require('nconf');
var Meatspace = require('meatspace');
var settings = require('./settings')(app, configurations, express);
var redis = require('redis');
var client = redis.createClient();

nconf.argv().env().file({ file: 'local.json' });

/* Initialize meat */

var meat = new Meatspace({
  fullName: 'anonymous',
  postUrl: nconf.get('domain') + ':' + nconf.get('authPort'),
  db: nconf.get('db'),
  limit: 12
});

/* Filters for routes */

var isAdmin = function (req, res, next) {
  if (req.session.email) {
    meat.fullName = req.session.fullName;
    meat.postUrl = 'http://generalgoods.net/' + req.session.username;
    meat.keyId = ':' + req.session.userId;
    next();
  } else {
    res.redirect('/logout');
  }
};

var hasNoAccount = function (req, res, next) {
  if (!req.session.userId) {
    next();
  } else {
    res.redirect('/');
  }
};

require('express-persona')(app, {
  audience: nconf.get('domain') + ':' + nconf.get('authPort')
});

// routes
require('./routes')(app, meat, nconf, client, isAdmin, hasNoAccount);
require('./routes/posts')(app, meat, nconf, client, isAdmin);
require('./routes/subscriptions')(app, meat, nconf, isAdmin);

app.listen(process.env.PORT || nconf.get('port'));
