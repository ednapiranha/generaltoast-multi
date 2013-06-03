'use strict';

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

  if (req.session.isAdmin) {
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
