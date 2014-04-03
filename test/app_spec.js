var express = require("../");
var request = require("supertest");

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
});
