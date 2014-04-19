(function() {
  function makeRoute(verb, handler) {
    function verbMatching(req, res, next) {
      if (req.method !== verb) next();
      else handler(req, res, next);
    }
    return verbMatching;
  }

  module.exports = makeRoute;
}());
