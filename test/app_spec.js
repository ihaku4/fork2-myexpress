var express = require("../");
var request = require("supertest");
var http = require("http");
var expect = require("chai").expect;
var assert = require("assert");

describe("app", function() {
  describe("create http server", function() {
    it("respond 404", function(done) {
      request(express())
        .get("/test")
        .expect(404)
        .end(function(err, res) {
          if (err) return done(err);
          done();
        });
    });
  });

  describe("Implemnt Empty App", function() {
    it("should return an http.Server", function(done) {
      expect(express().listen(2000, done)).to.be.instanceof(http.Server);
    });
  });

  describe(".use", function() {
    it("should be able to add middlewares to stack", function() {
      expect(express().use)
        .to.not.be.undefined;
      var app = express();
      app.use(function() {});
      app.use(function() {});
      //expect(app.stack.length).should.equal(2);
      //app.stack.length.should.equal(2);
      assert.equal(app.stack.length, 2);
    });
  });

  describe("calling middleware stack", function() {
    var app;
    beforeEach(function() {
      app = new express();
    });

    it("should be able to call a single middleware", function(done) {
      var RESPONSE_CONTENT = "hello from m1";
      var m1 = function(req, res, next) {
        res.end(RESPONSE_CONTENT);
      };
      app.use(m1);
      request(app)
        .get("/test")
        .expect(RESPONSE_CONTENT)
        .end(function(err, res) {
          if (err) return done(err);
          done();
        });
    });

    it("should be able to call next to go to the next middleware", function(done) {
      var RESPONSE_CONTENT = "hello from m2";
      var m1 = function(req, res, next) {
        next();
      };
      var m2 = function(req, res, next) {
        res.end(RESPONSE_CONTENT);
      };
      app.use(m1);
      app.use(m2);
      request(app).get("/test")
        .expect(RESPONSE_CONTENT)
        .end(function(err, res) {
          if (err) return done(err);
          done();
        });
    });

    it("should 404 at the end of middleware chain", function(done) {
      var m1 = function(req, res, next) {
       next();
      };
      var m2 = function(req, res, next) {
       next();
      };
      app.use(m1);
      app.use(m2);
      request(app).get("/test")
        .expect(404)
        .end(function(err, res) {
          if (err) return done(err);
          done();
        });
    });

    it("should 404 if no middleware is added", function(done) {
      app.stack = [];
      request(app).get("/test")
        .expect(404)
        .end(function(err, res) {
          if (err) return done(err);
          done();
        });
    })
  });

  describe("Implement error handling", function() {
    var app;
    beforeEach(function() {
      app = new express();
    });

//    it("should catch error when raised intentionally", function(done) {
//      var ERR_MSG = "oops";
//      app.use(function() {
//        throw new Error(ERR_MSG);
//      });
//      request(app).get("/test")
//        .expect("")
//    });
//
//    it("should catch error caused by api", function(done) {
//      app.use(function(res, req, next) {
//        fs.readFile("___fake_path___", function(err, content) {
//          if (err) next(err);
//        });
//      });
//    });
    it("should catch error when raised intentionally", function(done) {
      var m1 = function(req, res, next) {
        throw new Error("boom!");
      };
      app.use(m1);
      request(app).get("/test")
        .expect(500)
        .end(function(err, res) {
          if (err) return done(err);
          done();
        });
    });
    
    it("should return 500 for unhandled error", function(done) {
      var m1 = function(req, res, next) {
        next(new Error("boom!"));
      };
      app.use(m1);
      request(app).get("/test")
        .expect(500)
        .end(function(err, res) {
          if (err) return done(err);
          done();
        });
    });

    it("should skip error handlers when next is called without an error", function(done) {
      var m1 = function(req, res, next) {
        next();
      };
      var e1 = function(err, req, res, next) {
        console.log(err.message);
//        res.statusCode = 500;
//        res.end("e1");
        // timeout
      };
      var m2 = function(req, res, next) {
        res.end("m2");
      };
      app.use(m1);
      app.use(e1);
      app.use(m2);
      request(app).get("/test")
        .expect("m2")
        .end(function(err, res) {
          if (err) return done(err);
          done();
        });
    });

    it("should skip normal middlewares if next is call without an error", function(done) {
      var m1 = function(req, res, next) {
        next(new Error("boom!"));
      };
      var m2 = function(req, res, next) {
        // timeout...
      };
      var e1 = function(err, req, res, next) {
        res.end("e1");
      };
      app.use(m1);
      app.use(m2);
      app.use(e1);
      request(app).get("/test")
        .expect("e1")
        .end(function(err, res) {
          if (err) return done(err);
          done();
        });
    });
  });

  describe("Implement App Embedding As Middleware", function() {
    var app;
    var subApp;
    beforeEach(function() {
      app = new express();
      subApp = new express();
    });

    it("should pass unhandled request to parent", function(done) {
      function m2(req, res, next) {
        res.end("m2");
      }
      app.use(subApp);
      app.use(m2);
      request(app).get("/test")
        .expect("m2")
        .end(function(err, res) {
          if (err) return done(err);
          done();
        });
    });

    it("should pass unhandled error to parent", function(done) {
      var ERR_MSG = "m1 error";
      function m1(req, res, next) {
        next(ERR_MSG);
      }
      function e1(err, req, res, next) {
        res.end(err);
      }
      subApp.use(m1);
      app.use(subApp);
      app.use(e1);

      request(app).get("/test")
        .expect(ERR_MSG)
        .end(function(err, res) {
          if (err) return done(err);
          done();
        });
    });
  });
});

describe("Simple Request Path Matcher", function() {

  describe("Implement Layer class and the match method", function() {
    it("should match path", function() {
      var Layer = require("../lib/layer.js");
      var layer = new Layer("/foo", function() {});
      expect(layer.match("/bar")).to.be.undefined;
      expect(layer.match("/foo")).to.have.property("path", "/foo");
      expect(layer.match("/foo/bar")).to.have.property("path", "/foo");
    });
  });

  describe("Implement app.use should create a Layer and add it to app.stack", function() {
    var Layer, layer;
    var app;
    beforeEach(function() {
      Layer = require("../lib/layer.js");
      layer = new Layer("/foo", function() {});
      app = express();
      app.use(function() {});
      app.use("/foo", function() {});
    });

    it("length of app.stack should larger than zero", function() {
      expect(app.stack.length).to.eql(2);
    });

    it("elements of app.stack should be instance of Layer", function() {
      expect(app.stack[0]).to.be.instanceof(Layer);
      expect(app.stack[1]).to.be.instanceof(Layer);
    });

    it("first layer's path should be /", function() {
      expect(app.stack[0].match("/")).to.have.property("path", "/");
//      expect(app.stack[0].match("/")).to.have.property("path", "");
    });

    it("second layer's path should be /foo", function() {
      expect(app.stack[1].match("/foo")).to.have.property("path", "/foo");
    });
  });

  describe("The middlewares called should match request path", function() {
    var app;
    beforeEach(function() {
      app = new express();
      app.use("/foo", function(req, res, next) {
        res.end("foo");
      });
      app.use("/", function(req, res) {
        res.end("root");
      });
    });

    it("returns root for GET /", function(done) {
      request(app).get("/")
        .expect("root")
        .end(function(err, res) {
          if (err) return done(err);
          done();
        });
    });

    it("returns foo for GET /foo", function(done) {
      request(app).get("/foo")
        .expect("foo")
        .end(function(err, res) {
          if (err) return done(err);
          done();
        });
    });

    it("returns foo for GET /foo/bar", function(done) {
      request(app).get("/foo/bar")
        .expect("foo")
        .end(function(err, res) {
          if (err) return done(err);
          done();
        });
    });
  });

  describe("The error handlers called should match request path", function() {
    var app;
    beforeEach(function() {
      app = new express();
      app.use("/foo", function(req, res, next) {
        throw "boom!";
      });
      app.use("/foo/a", function(err, req, res, next) {
        res.end("error handled /foo/a");
      });
      app.use("/foo/b", function(err, req, res, next) {
        res.end("error handled /foo/b");
      });
    });

    it("returns error handled /foo/a for GET /foo/a", function(done) {
      request(app).get("/foo/a")
        .expect("error handled /foo/a")
        .end(function(err, res) {
          if (err) return done(err);
          done();
        });
    });

    it("returns error handled /foo/b for GET /foo/b", function(done) {
      request(app).get("/foo/b")
        .expect("error handled /foo/b")
        .end(function(err, res) {
          if (err) return done(err);
          done();
        });
    });

    it("returns 500 for GET /foo", function(done) {
      request(app).get("/foo")
        .expect(500)
        .end(function(err, res) {
          if (err) return done(err);
          done();
        });
    });
  });
});
  
describe("Fancy Request Path Matcher", function() {
  describe("Implement Path Parameters Extraction", function() {
    var layer, Layer;
    beforeEach(function() {
      Layer = require("../lib/layer.js");
      layer = new Layer("/foo/:a/:b", function() {});
    });

    it("should return undefined for /foo", function() {
      expect(layer.match("/foo")).to.be.undefined;
    });

    it("should return undefined for /foo/apple", function() {
      expect(layer.match("/foo/apple")).to.be.undefined;
    });

    it("should return object for /foo/apple/xiaomi", function() {
      expect(layer.match("/foo/apple/xiaomi")).to.deep.equal({path: "/foo/apple/xiaomi", params: {a: "apple", b: "xiaomi"}});
    });

    it("should return object for /foo/apple/xiaomi/htc", function() {
      expect(layer.match("/foo/apple/xiaomi/htc")).to.deep.equal({path: "/foo/apple/xiaomi", params: {a: "apple", b: "xiaomi"}});
    });
  });

  describe("Implement req.params", function() {
    var app;
    beforeEach(function() {
      app = new express();
      app.use("/foo/:a", function(req, res, next) {
        res.end(req.params.a);
      });
      app.use("/foo", function(req, res, next) {
        res.end(""+req.params.a);
      });
    });

    it("should return parameter when a parameter is given", function(done) {
      request(app).get("/foo/this_is_a_parameter")
        .expect("this_is_a_parameter")
        .end(function(err, res) {
          if (err) return done(err);
          done();
        });
    });

    it("should return undefined when a parameter is missing", function(done) {
      request(app).get("/foo")
        .expect("undefined")
        .end(function(err, res) {
          if (err) return done(err);
          done();
        });
    });
  });

  describe("Implement Prefix Path Trimming", function() {
    var app;
    beforeEach(function() {
      app = new express();
      var subApp = new express();
      subApp.use("/bar", function(req, res) {
        res.end("embedded app: " + req.url);
      });
      app.use("/foo", subApp);
      app.use("/foo", function(req, res) {
        res.end("handler: " + req.url);
      });
    });

    it("app should have the handle method", function() {
      expect(app.handle).to.be.instanceof(Function);
    });

    it("Prefix path trimming for embedded app", function(done) {
      request(app).get("/foo")
        .expect("handler: /foo")
        .end(function(err, res) {
          if (err) return done(err);
          done();
        });
    });

    it("Prefix path trimming for embedded app", function(done) {
      request(app).get("/foo/bar")
//        .expect("embedded app: /foo/bar")
        .expect("embedded app: /bar")
        .end(function(err, res) {
          if (err) return done(err);
          done();
        });
    });
  });
});

describe("http verbs", function() {
  describe("create the makeRoute(verb, handler) constructor", function() {
    it("should return function(req, res, next).", function() {
      var verbMatching = require("../lib/route.js");
      var route = verbMatching("get", function() {});
      expect(route.length).to.eql(3);
    });
  });

  describe("implement app.get", function() {
    var app;
    beforeEach(function() {
      app = express();
      app.get("/foo", function(req, res) {
        res.end("foo");
      });
    });

    it("should response for GET request", function(done) {
      request(app).get("/foo")
        .expect("foo")
        .end(done);
    });
  });
});

describe("Route Chaining", function() {
  describe("implement multiple handlers", function() {
    var route;
    var handler1 = function() {};
    var handler2 = function() {};
    beforeEach(function() {
      var makeRoute = require("../lib/route.js");
      route = makeRoute();
      route.use("get", handler1);
      route.use("post", handler2);
    });

    it("adds multiple handlers to route", function() {
      expect(route.stack.length).to.eql(2);
    });

    it("pushes action object to the stack", function() {
      expect(route.stack[0]).to.instanceof(Object);
      expect(route.stack[1]).to.instanceof(Object);
    });
  });
});
