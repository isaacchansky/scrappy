# Scrappy API
A scrappy little screen scraping API.

[When scraping data, please consider the website's terms of use](https://en.wikipedia.org/wiki/Web_scraping#Legal_issues)


demo at [https://scrappyapi.herokuapp.com/](https://scrappyapi.herokuapp.com/)

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

## Docs

### GET `/v1/parse`
> Use GET requests for simple, convenient, flat things.

Parameter | Description
---|---
_url (**required**) | The url of the web page to be scraped
_textOnly (**optional**) | Set this to true if you want to only ever return text, never html. This is useful if you have markup like  `<td> 100 <span class="label">cm</span></td>` and would prefer to have `... width: '100 cm', ...` returned, rather than `... width: '100 <span class="label">cm</span>', ...`
_returnFullMarkup (**optional**) | Set this to true if you want to also return the full html markup in your response
* (anything except 'url' or 'textOnly') | These are the attributes of your returned data structure. The values of these parameters **must be jQuery style selectors** (exmaples: `table.locations > tr:last-child > td:last-child`, `title` )

### POST `/v1/parse`
> Use POST requests if you need more complex structured data.

**POST body format**
```
{
  "_url": <URL String>,
  "_attributes": {
    <ATTR> : {
      "_type": <"number" | "text" | "html">,
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
        "_type": <"number" | "text" | "html">,
        "_selector": <jQuery Selector>,

        - IF COMPLEX (object) COLLECTION
        "_object": {
          <ATTR> : {
            "_type": <"number" | "text" | "html">,
            "_selector": <jQuery Selector>,
          }
        }
      }
    },
    ...
  }
}
```

## Why
A lot of websites contain some great data stuck inside html.


## What does it do, exactly?
It makes a request to grab the page HTML then returns structured JSON based on "jQuery style" selectors that you specify.


## What's next?
Immediate thoughts are adding support for:
  - attribute defaults - some things shouldn't be null if they aren't there, maybe they should be 0, false, etc.
  - booleans - to check for the presence of something vs just returning its value.
