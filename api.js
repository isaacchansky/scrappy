/*jshint esversion:6 */
'use strict';
var express = require('express');
var cheerio = require('cheerio');
var request = require('request');
var bodyParser = require('body-parser')

var app = express();

app.set('port', (process.env.PORT || 5000));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

app.use(function(req, res, next) {
  res.setHeader('Content-Type', 'application/json');
  next();
})

// namespace middleware-added variables
app.use(function(req, res, next) {
  req.scrappy = {};
  next();
});


/**
 * Get page content of desired url, add it to the request obj.
 */
function pullPageContent(req, res, next) {
  var url;
  if (req.method === "GET") {
    url = req.query._url;
  } else if (req.method === "POST") {
    url = req.body._url;
  } else {
    res.status(400).send({
      error: 'Method Not Allowed'
    });
  }

  var opts = {
    url: url,
    headers: {
      'user-agent': 'request.js'
    },
    gzip: true
  };

  if (!url) {
    res.status(400).send({
      error: 'Bad Request: must have a specified url'
    });
  } else {
    request(opts, function(error, response, body) {
      if (error || response.statusCode != 200) {
        res.status(500).send({
          error: error
        });
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
  var attributes = Object.keys(req.query).filter((k) => ['url', 'textOnly'].indexOf(
    k) < 0);
  var page = cheerio.load(req.scrappy.html);
  attributes.forEach(function(attr) {
    var selector = req.query[attr];
    if (req.query.textOnly && req.query.textOnly.toLowerCase() != "false") {
      req.scrappy.jsonAttr[attr] = page(selector).text();
    } else {
      req.scrappy.jsonAttr[attr] = page(selector).html();
    }
  });

  req.scrappy.jsonAttr.fullPageContent = page.html();

  next();
}



/*

FOR NON COLLECTIONS

{
  "_url": <URL String>,
  "_attributes": {
    <ATTR> : {
      "_type": <"number" | "type" | "text" | "html">,
      "_selector": <jQuery Selector>
    },
    ...
  }
}


FOR COLLECTIONS:

{
  "_url": <URL String>,
  "_attributes": {
    <ATTR> : {
      "_type": "collection",
      "_selector": <jQuery Selector>,
      "_children": {

        - IF SIMPLE COLLECTION
        "_type": <"number" | "type" | "text" | "html">,
        "_selector": <jQuery Selector>,

        - IF COMPLEX (object) COLLECTION
        "_object": {
          <ATTR> : {
            "_type": <"number" | "type" | "text" | "html">,
            "_selector": <jQuery Selector>,
          }
        }
      }
    },
    ...
  }
}

*/

function isValidAttrType(type, allowCollection) {
  var validTypes = ['number', 'text', 'html'];
  if (allowCollection) {
    validTypes.push('collection');
  }
  return validTypes.indexOf(type) > -1;
}


function coerceType(content, type) {
  content = cheerio(content);
  // console.log(content);
  if (type === "number") {
    return parseInt(content.text(), 10);
  } else if (type === "text") {
    return content.text().replace(/\n/g, '').trim();
  } else {
    return content.text();
  }
}


function parsePostBody(req, res, next) {
  req.scrappy.jsonAttr = {};
  var page = cheerio.load(req.scrappy.html);


  Object.keys(req.body._attributes).forEach(function(attr) {
    var attrDef = req.body._attributes[attr];
    if (!isValidAttrType(attrDef._type, true)) {
      res.status(400).send({
        error: `Bad Request: invalid type parameter '${attrDef._type}'`
      });
    } else {
      if (attrDef._type === "collection") {
        req.scrappy.jsonAttr[attr] = []; // initialize attribute to empty array
        // Parse collection stuff
        let collectionRoot = page(attrDef._selector);
        let content = collectionRoot.find(attrDef._children._selector);

        if (attrDef._children && attrDef._children._object) {
          // parse object collection`
          let objAttrs = Object.keys(attrDef._children._object);
          content.each(function(i, item) {
            let obj = {};
            objAttrs.forEach(function(objAttr) {

              obj[objAttr] = coerceType(
                cheerio(item).find(attrDef._children._object[
                  objAttr]._selector),
                attrDef._children._object[objAttr]._type
              );
            });
            req.scrappy.jsonAttr[attr].push(obj);
          });

        } else if (attrDef._children) {
          // parse simple collection
          let type = attrDef._children._type.toLowerCase();
          if (content.length) {
            content.each(function(i, item) {
              req.scrappy.jsonAttr[attr].push(coerceType(item, type));
            });
          }
        }

      } else {
        let val = page(attrDef._selector);
        let type = attrDef._type.toLowerCase();
        val = coerceType(val, type);

        req.scrappy.jsonAttr[attr] = val;
      }
    }
  });

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
    res.status(200).send(req.scrappy.jsonAttr);
  });



/*
        POST makes more sense for complex structures.
*/
app.post('/v1/parse',
  pullPageContent,
  parsePostBody,
  function(req, res) {
    res.send(req.scrappy.jsonAttr);
  });

// Last, Handle 404
app.get('*', function(req, res, next) {
  res.status(404).send({
    message: 'This endpoint does not exist.'
  });
});

module.exports = app;
