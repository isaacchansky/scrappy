/*global describe:true, it:true */
/*jshint esversion:6 */

var request = require('supertest');
var api = require('../api');

describe('API v1', function() {
  describe('/v1/parse GET endpoint', function() {
    it('returns 400 if no url supplied', function(done) {
      request(api)
        .get('/v1/parse')
        .expect('Content-Type', /json/)
        .expect(400, done);
    });
  });

  describe('Generic Errors', function() {
    it('returns 404 if endpoint does not exist', function(done) {
      request(api)
        .get('/bogus')
        .expect('Content-Type', /json/)
        .expect(404, done);
    });
  });
});
