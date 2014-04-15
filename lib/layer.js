(function() {
  function Layer(path, middleware) {
    this.handle = middleware;
    this.match = function(pattern) {
      if (pattern.indexOf(path) === 0) return {"path": path};
    };
  }

  module.exports = Layer;
}());
