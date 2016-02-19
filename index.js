/*jshint esversion:6 */
var express = require('express');
var cheerio = require('cheerio');
var request = require('request');

var app = express();

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));

// namespace middleware-added variables
app.use(function(req,res,next){ req.scrappy = {}; next(); });

/**
 * Get page content of desired url, add it to the request obj.
 */
function pullPageContent(req, res, next) {
  var opts = {
    url: req.query.url,
    headers: {
      'user-agent': 'request.js'
    },
    gzip: true
  };

  if(!req.query.url) {
    res.status(400).send({ error: 'Malformed request: must have a specified url' });
  } else {
    request(opts, function(error, response, body) {
      if(error || response.statusCode != 200) {
        res.status(500).send({ error: error });
      }
      req.scrappy.html = body;
      next();
    });
  }
}

/**
 * Look at query parameters and attach attributes to the req object.
 */
function parseAttributes(req, res, next) {
  req.scrappy.jsonAttr = {};
  var attributes = Object.keys(req.query).filter((k) => ['url','textOnly'].indexOf(k) < 0);
  var page = cheerio.load(req.scrappy.html);
  console.log(req.query);
  attributes.forEach(function(attr) {
    var selector = req.query[attr];
    if(req.query.textOnly && req.query.textOnly.toLowerCase() != "false") {
      req.scrappy.jsonAttr[attr] = page(selector).text();
    } else {
      req.scrappy.jsonAttr[attr] = page(selector).html();
    }
  });

  req.scrappy.jsonAttr['fullPageContent'] = page.html();

  next();
}

/*
   * Parse API: V1
   * expected query parameters:
   * 	url (required): the URL of desired web page
   * 	textOnly (optional, default false): only pulls text, not any html.
   *
   * 	any number of keys which map to query selectors for content within the web page.
 */
app.get('/v1/parse',
        pullPageContent,
        parseAttributes,
        function(req, res) {
          res.send(req.scrappy.jsonAttr);
        });


app.listen(app.get('port'), function() {
  console.log(`Scrappy is running at localhost: ${app.get('port')}`);
});
