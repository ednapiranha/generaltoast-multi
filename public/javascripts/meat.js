define(['jquery'],
  function($) {
  'use strict';

  var body = $('body');

  var generatePost = function (post, admin, isSubscription) {
    var isPrivate = '';
    var shared = '';
    var permalink = '';
    var isAdmin = '';
    var urls = [];

    var breakify = function (text) {
      return text.replace(/[\n]/gi, '<br>');
    };

    if (post.meta.isPrivate) {
      isPrivate = 'private';
    }

    if (post.content.urls) {
      for (var i = 0; i < post.content.urls.length; i ++) {
        var url = post.content.urls[i];
        var result = '';

        if (url.url.match(/\.[jpg|jpeg|gif|png]\??/i)) {
          result = '<a class="image" href="' + url.url + '" title="' +
            url.title + '"><img src="' + url.url + '"></a>';
        } else {
          result = '<a class="link" href="' + url.url + '" title="' +
            url.title + '">' + url.title + '</a>';
        }

        urls.push('<li>' + result + '</li>');
      }
    }

    if (urls) {
      urls = '<ul class="links">' + urls.join('') + '</ul>';
    }

    if (admin) {
      isAdmin = '<a href="/edit/' + post.id + '" title="Edit">E</a>' +
        '<a href="javascript:;" data-url="/delete/' + post.id +
        '" data-action="delete-post" title="Delete">D</a>';
    }

    if (post.meta.originUrl.indexOf(document.location.origin) === 0) {
      post.meta.originUrl = document.location.origin + '/post/' + post.username +
        '/' + post.id;
    }

    if (isSubscription) {
      if (body.data('authenticated') === true) {
        // If this url is from us, make sure to add the username
        permalink = '<a href="javascript:;" data-action="share" data-url="' +
          post.meta.originUrl + '" title="Share">S</a>';
      }
    } else {
      permalink = '<a href="javascript:;" ' +
        'data-action="get-post" data-url="/post/' + body.data('username') + '/' +
        post.id + '" ' + 'class="permalink" title="Permalink">P</a>';
    }

    if (post.meta.isShared || isSubscription) {
      shared = '<a href="' + post.meta.originUrl + '" title="Origin" target="_blank">O</a>';
    }

    return $('<article id="post_' + post.id + '" class="article ' +
      isPrivate + '"><p>' + breakify(post.content.message) + '</p>' + urls +
      '<div class="actions">' + isAdmin + permalink + shared + '</div></article>');
  };

  var getRecent = function (paginated) {
    var prev;
    var next;
    var start = document.location.search.split('start=')[1] || 0;

    if (paginated) {
      if (paginated.hasClass('prev')) {
        start = parseInt(paginated.attr('data-prev'), 10);
      } else {
        start = parseInt(paginated.attr('data-next'), 10);
      }
    }

    var username = body.data('username');

    $.getJSON('/posts/all', {
      start: start,
      username: username
    }, function (data) {
      if (data.posts) {
        history.pushState(data.posts, 'posts', '/' + body.data('username') + '?start=' + start);
        body.find('.messages').empty();

        for (var i = 0; i < data.posts.length; i ++) {
          body.find('.messages').append(generatePost(data.posts[i], data.isAdmin, false));
        }

        var next = body.find('.pagination .next');

        if (data.next !== false) {
          next.attr('href', '/' + username + '?start=' + data.next)
              .removeClass('hidden');
        } else {
          next.addClass('hidden');
        }

        var prev = body.find('.pagination .prev');

        if (data.prev !== false) {
          prev.attr('href', '/' + username + '?start=' + data.prev)
              .removeClass('hidden');
        } else {
          prev.addClass('hidden');
        }

        body.find('.pagination a').attr('data-prev', data.prev)
                                  .attr('data-next', data.next);
      }
    });
  };

  var self = {
    getAll: function () {
      getRecent();
      body.find('h1').text('Recent');

      $.getJSON('/subscription/' + body.data('username') +'/all', function (data) {
        if (data.posts) {
          body.find('.subscriptions').empty();

          for (var i = 0; i < data.posts.length; i ++) {
            body.find('.subscriptions').append(generatePost(data.posts[i], false, true));
          }
        }
      });
    },

    getPaginated: function (self) {
      getRecent(self);
    },

    getOne: function (self) {
      $.getJSON(self.data('url'), function (data) {
        if (data.post) {
          history.pushState(data.post, 'post ' + data.post.id, '/post/' + body.data('username') + '/' + data.post.id);
          body.find('h1').text('Post');
          body.attr('data-page', 'post')
              .attr('data-url', '/post/' + body.data('username') + '/' + data.post.id);
          body.find('.messages').html(generatePost(data.post, data.isAdmin, false));
          body.find('.pagination a').addClass('hidden');
        }

        if (body.find('.subscriptions article').length < 1) {
          $.getJSON('/subscription/' + body.data('username') + '/all', function (data) {
            if (data.posts) {
              body.find('.subscriptions').empty();

              for (var i = 0; i < data.posts.length; i ++) {
                body.find('.subscriptions').append(generatePost(data.posts[i], data.isAdmin, true));
              }
            }
          });
        }
      });
    },

    deleteOne: function (self) {
      $.post(self.data('url'), function (data) {
        self.closest('article').addClass('hidden');
      });
    },

    share: function (self) {
      $.post('/posts/share', { url: self.data('url') }, function (data) {
        body.find('.messages').prepend(generatePost(data.post, true, false));
      });
    },

    deleteSubscription: function (self) {
      $.post('/subscription/unsubscribe', { url: self.data('url') }, function (data) {
        self.closest('li').addClass('hidden');
      });
    }
  };

  return self;
});
