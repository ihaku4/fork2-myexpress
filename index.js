function express() {
  var http = require("http");
  var Layer = require("./lib/layer.js");
  function app(req, res) {
    var i = 0;
    var layer;
    var url = req.url;

    // should statements after this function execute?
    var next = function(err) {
      layer = app.stack[i++];
      if (!err) {
        while (layer && (layer.handle.length === 4 || !layer.match(url)))
          layer = app.stack[i++];
        if (layer) {
          req.params = layer.match(url).params;
          req.url = layer.getPath();
          layer.handle(req, res, next); 
        }
        else {
          res.statusCode = 404;
          res.end();
        }
      }
      else {
        while (layer && (layer.handle.length !== 4 || !layer.match(url))) 
          layer = app.stack[i++];
        if (layer) {
          req.params = layer.match(url).params;
          req.url = layer.getPath();
          layer.handle(err, req, res, next);
        }
        else throw err; 
      }
    };

    try {
      next();
    } catch (err) {
      try {
        next(err);
      } catch (unhandledErr) {
        res.statusCode = 500;
        res.end();
      }
    }
  } 
  app.listen = function(port, callback) {
    return http.createServer(this).listen(port, callback);
  };
  app.use = function() {
    var path, middleware;
    var layer;
    var i, len;
    if (arguments.length === 1) {
      path = "/";
      middleware = arguments[0];
    }
    else if (arguments.length === 2) {
      path = arguments[0];
      middleware = arguments[1];
    }
    layer = new Layer(path, middleware);
    if (middleware.stack instanceof Array) {
      for (i = 0, len = middleware.stack.length; i < len; i++) {
        middleware.stack[i].setPathPrefix(layer.getPath());
        app.stack.push(middleware.stack[i]);
      }
    } else app.stack.push(layer);
  };
  app.stack = [];
  app.handle = function() {};
  return app;
}

module.exports = express;
