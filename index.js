function express() {
  var http = require("http");
  var Layer = require("./lib/layer.js");
  function app() {
    var req, res, parentNext, parentErr;
    var appArguments = arguments;
    if (arguments.length < 4) {
      parentNext = arguments[2];
      res = arguments[1];
      req = arguments[0];
    } else {
      parentErr = arguments[0];
      req = arguments[1];
      res = arguments[2];
      parentNext = arguments[3];
    }
    var i = 0;
    var layer;
    var url = req.url;

    // should statements after this function execute?
    var next = function(err) {
      req.url = url; // url
      layer = app.stack[i++];
      while (layer && 
          (((!err && layer.handle.length === 4) || 
                  (err && layer.handle.length !== 4)) || 
              !layer.match(url)))
        layer = app.stack[i++];
      if (layer) {
        req.params = layer.match(url).params;
        if (req.url.charAt(req.url.length-1) === "/") 
          req.url = req.url.substring(0, req.url.length-1);
        if (layer.handle.stack instanceof Array)
          req.url = req.url.substring(layer.getPath().length);
//        layer.handle.apply(this, appArguments); // why this not work?
        if (err) layer.handle.call(this, err, req, res, next); 
        else layer.handle.call(this, req, res, next);
      }
      else if (parentNext) {
        if (!err) parentNext();
        else parentNext(err);
      }
      else {
        if (err) throw err;
        res.statusCode = 404;
        res.end();
      }
    };

    try {
      if (!parentErr) next();
      else next(parentErr);
    } catch (err) {
      try {
        next(err);
      } catch (unhandledErr) {
        console.log(unhandledErr);
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
    app.stack.push(layer);
  };
  app.stack = [];
  app.handle = function() {
    app.apply(this, arguments);
  };
  return app;
}

module.exports = express;
