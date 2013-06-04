'use strict';

module.exports = function (app, meat, nconf, client, isAdmin, hasNoAccount) {
  var utils = require('../lib/utils');
  var gravatar = require('gravatar');

  app.get('/', function (req, res, next) {
    var users = [];

    var getAvatars = function (username, usernames) {
      client.get('userEmail:' + username, function (err, email) {
        users.push({
          username: username,
          avatar: gravatar.url(email, { size: 290 })
        });

        if (users.length === usernames.length) {
          res.render('index', {
            url: '/',
            users: users,
            page: 'landing',
            username: ''
          });
        }
      });
    };

    var renderIndex = function () {
      client.send_command('SRANDMEMBER', ['usernames', '12'], function (err, usernames) {
        if (err) {
          res.status(500);
          next();
        } else {
          if (usernames.length > 0) {
            for (var i = 0; i < usernames.length; i ++) {
              getAvatars(usernames[i], usernames);
            }
          } else {
            res.render('index', {
              url: '/',
              users: [],
              page: 'landing',
              username: ''
            });
          }
        }
      });
    };

    if (req.session.email && !req.session.username) {
      client.hgetall('user:' + req.session.email, function (err, user) {
        if (err || !user) {
          // New user signup
          res.redirect('/user/new');
        } else {
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
    var username = req.body.username
                           .toString()
                           .replace(/[^A-Z0-9\-_]+/gi, '')
                           .toLowerCase().trim();
    var fullName = req.body.full_name
                           .toString()
                           .trim();

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
              req.session.fullName = fullName;
              req.session.username = username;
              req.session.postUrl = 'http://generalgoods.net/' + req.session.username;

              client.hmset('user:' + req.session.email, user);
              client.set('usernameId:' + user.username, user.id);
              client.set('userEmail:' + user.username, req.session.email);
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
