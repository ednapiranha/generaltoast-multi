define(['jquery', 'meat'],
  function($, meat) {
  'use strict';

  var body = $('body');
  var currentLocation;
  var currentUser = localStorage.getItem('personaEmail');

  var checkUrl = function () {
    var url = body.attr('data-url');

    if (url) {
      if (url.indexOf('/post/') > -1 || url.indexOf('/edit/') > -1) {
        if (url.indexOf('/edit/') > -1) {
          body.find('.container.last').addClass('hidden');
        } else {
          body.attr('data-page', 'post');
        }
        meat.getOne(body);
      } else if (url.indexOf('/posts/recent') > -1 || url.match(/\/[A-Z0-9\-_]+/gi)) {
        body.find('.container.last').removeClass('hidden');
        meat.getAll();
      } else {
        return;
      }
    }
  }

  checkUrl();

  if (navigator.geolocation && body.data('page') === 'edit') {
    navigator.geolocation.getCurrentPosition(function (loc) {
      body.find('form input[name="geolocation"]').val(loc.coords.latitude +
        ', ' + loc.coords.longitude);
    });
  }

  navigator.id.watch({
    loggedInUser: currentUser,
    onlogin: function (assertion) {
      $.ajax({
        type: 'POST',
        url: '/persona/verify',
        data: { assertion: assertion },
        success: function (res, status, xhr) {
          localStorage.setItem('personaEmail', res.email);
          document.location.href = '/';
        },
        error: function(res, status, xhr) {
          console.log('error logging in');
        }
      });
    },
    onlogout: function() {
      $.ajax({
        url: '/persona/logout',
        type: 'POST',
        success: function(res, status, xhr) {
          $.get('/user/logout', function () {
            localStorage.removeItem('personaEmail');
            document.location.href = '/';
          });
        },
        error: function(res, status, xhr) {
          console.log('logout failure ', res);
        }
      });
    }
  });

  window.onpopstate = function (ev) {
    if (ev.state) {
      body.attr('data-url', document.location.pathname)
          .attr('data-page', 'index');
      checkUrl();
    }
  }

  window.onpushstate = function (ev) {
    body.attr('data-url', document.location.pathname)
        .attr('data-page', 'index');
    checkUrl();
  }

  $('form').on('submit', function (ev) {
    $(this).find('button').attr('disabled', disabled);
  });

  body.on('click', function (ev) {
    var self = $(ev.target);

    switch (self.data('action')) {
      case 'login':
        ev.preventDefault();
        navigator.id.request();
        break;

      case 'logout':
        ev.preventDefault();
        navigator.id.logout();
        break;

      case 'get-post':
        ev.preventDefault();
        meat.getOne(self);
        break;

      case 'delete-post':
        ev.preventDefault();
        meat.deleteOne(self);
        break;

      case 'share':
        ev.preventDefault();
        meat.share(self);
        break;

      case 'delete-subscription':
        ev.preventDefault();
        meat.deleteSubscription(self);
        break;

      case 'pagination':
        ev.preventDefault();
        meat.getPaginated(self);
        break;
    }
  });
});
