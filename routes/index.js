'use strict';

module.exports = function (app, meat, nconf, isAdmin) {
  var utils = require('../lib/utils');

  app.get('/', function (req, res) {
    var isAdmin = false;

    if (req.session.email) {
      isAdmin = true;
      req.session.isAdmin = true;
      meat.keyId = ':' + req.session.email;
    }

    var pagination = utils.setPagination(req, meat);

    res.render('index', {
      url: '/',
      isAdmin: isAdmin,
      page: 'index',
      prev: pagination.prev,
      next: pagination.next
    });
  });

  app.get('/logout', function (req, res) {
    req.session.reset();
    res.redirect('/');
  });
};
