function express() {
  var http = require("http");
  function app(req, res) {
    var i = 0;
    var middleware;

    // should statements after this function execute?
    var next = function(err) {
      middleware = app.stack[i++];
      if (!err) {
        while (middleware && middleware.length === 4)
          middleware = app.stack[i++];
        if (middleware) middleware(req, res, next); 
        else {
          res.statusCode = 404;
          res.end();
        }
      }
      else {
        while (middleware && middleware.length !== 4) 
          middleware = app.stack[i++];
        if (middleware) middleware(err, req, res, next);
        else throw err; 
      }
    };

    try {
      next();
    } catch (err) {
      res.statusCode = 500;
      res.end();
    }
  } 
  app.listen = function(port, callback) {
    return http.createServer(this).listen(port, callback);
  }
  app.use = function(middleware) {
    var i, len;
    if (middleware.stack instanceof Array) {
      for (i = 0, len = middleware.stack.length; i < len; i++)
        app.stack.push(middleware.stack[i]);
    } else app.stack.push(middleware);
  }
  app.stack = [];
  return app;
}

module.exports = express;
