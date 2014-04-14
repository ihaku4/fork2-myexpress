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

