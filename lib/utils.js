'use strict';

exports.isEditor = function (req, meat) {
  if (req.session.username && (req.session.username === req.query.username ||
    req.session.username === req.params.username)) {
    return true;
  }

  return false;
};

exports.setPagination = function (req, meat) {
  var start = parseInt(req.query.start, 10) || 0;
  var prev = 0;
  var next = meat.limit;

  if (isNaN(start)) {
    start = 0;
  }

  prev = start - meat.limit - 1;

  if (prev < 1) {
    prev = 0;
  }

  next = start + meat.limit + 1;

  if (this.isEditor(req, meat)) {
    if (next >= meat.totalAll) {
      next = false;
    }
  } else {
    if (next >= meat.totalPublic) {
      next = false;
    }
  }

  if (prev === start) {
    prev = false;
  }

  return {
    next: next,
    prev: prev
  };
};
