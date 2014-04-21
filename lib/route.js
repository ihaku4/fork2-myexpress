(function() {
  var methods = require("methods");
  methods.push("all");

  function makeRoute(verb, handler) {
    function route(req, res, parentNext) {
      var i = 0;
      function next(opt) {
        if (opt) {
          if (opt === "route") parentNext();
          else throw opt;
        }
        var action = route.stack[i++];
        if (!action) parentNext();
        else if (action.verb.toUpperCase() !== req.method && 
            action.verb !== "all") 
          next(); // toUpperCase
        else action.handler(req, res, next);
      }
      try {
        next();
      } catch (err) {
        parentNext(err);
      }
    }
    route.use = function(verb, handler) {
      var action = {
        verb: verb,
        handler: handler
      };
      route.stack.push(action);
      return route;
    };
    route.stack = [];
    if (verb && handler) route.use(verb, handler);
    methods.forEach(function(method) {
      route[method] = function(handler) {
        return route.use(method, handler);
      };
    });
    return route;
  }

  module.exports = makeRoute;
}());
