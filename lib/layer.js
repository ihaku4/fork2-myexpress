(function() {
  var p2re = require("path-to-regexp");

  function Layer(path, middleware) {
    var pathPrefix = "";
    if (path.charAt(path.length-1) === "/") 
      path = path.substring(0, path.length-1);
    this.handle = middleware;
    this.match = function(url) {
      if (url.charAt(url.length-1) === "/") 
        url = url.substring(0, url.length-1);
      url = decodeURIComponent(url);
      var result = {};
      var i, len;
      var names = [];
      var re = p2re(pathPrefix + path, names, {end: false});
      var m = re.exec(url);
      
      if (!m) return;
      result["path"] = (m[0] !== "" ? m[0] : "/");
      result["params"] = {};
      for (i = 0, len = names.length; i < len; i++) {
        result["params"][names[i]["name"]] = m[i+1];
      }
      return result;
    };
    this.setPathPrefix = function(newPathPrefix) {
      pathPrefix = newPathPrefix;
    };
    this.getPath = function() {
      return path;
    };
  }

  module.exports = Layer;
}());
