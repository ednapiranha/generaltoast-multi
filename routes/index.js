'use strict';

module.exports = function (app, meat, nconf, client, isAdmin, hasNoAccount) {
  var utils = require('../lib/utils');

  app.get('/', function (req, res, next) {
    var isAdmin = false;

    var renderIndex = function () {
      var pagination = utils.setPagination(req, meat);

      res.render('index', {
        url: '/',
        isAdmin: isAdmin,
        page: 'index',
        prev: pagination.prev,
        next: pagination.next
      });
    };

    if (req.session.email) {
      isAdmin = true;
      req.session.isAdmin = true;

      client.hgetall('user:' + req.session.email, function (err, user) {
        if (err || !user) {
          // New user signup
          res.redirect('/user/new');
        } else {
          // Set the key id to the user's email
          meat.keyId = ':' + req.session.userId;
          renderIndex();
        }
      });
    } else {
      renderIndex();
    }
  });

  app.get('/user/new', hasNoAccount, function (req, res) {
    res.render('users/new', {
      page: 'new-user',
      fullName: '',
      username: ''
    });
  });

  app.post('/user/new', hasNoAccount, function (req, res, next) {
    var username = req.body.username.toString()
                           .replace(/[^A-Z0-9\-_]+/gi, '')
                           .toLowerCase().trim();
    var fullName = req.body.full_name.toString().trim();

    var renderPage = function (message) {
      res.render('users/new', {
        page: 'new-user',
        error: message,
        fullName: req.body.full_name || '',
        username: req.body.username || ''
      });
    };

    if (!fullName) {
      renderPage('Full name is mandatory');
    } else if (!username) {
      renderPage('Username is mandatory');
    } else {
      client.sismember('usernames', username, function (err, status) {
        if (err || status) {
          renderPage('Username already taken');
        } else {
          client.sadd('usernames', username);
          client.incr('userIds', function (err, id) {
            if (err) {
              res.status(500);
              next();
            } else {
              var user = {
                id: id,
                fullName: fullName,
                username: username
              };

              req.session.userId = id;
              req.session.username = username;
              req.session.fullName = fullName;

              meat.keyId = ':' + id;
              meat.fullName = fullName;
              meat.postUrl = 'http://generalgoods.net/' + username;

              client.hmset('user:' + req.session.email, user);
              res.redirect('/');
            }
          });
        }
      });
    }
  });

  app.get('/user/logout', function (req, res) {
    req.session.reset();
    res.redirect('/');
  });
};
