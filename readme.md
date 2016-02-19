# Scrappy API
A scrappy little screen scraping API.

## Docs

### `/v1/parse`

Parameter | Description
---|---
url (**required**) | The url of the web page to be scraped
textOnly (**optional**) | Set this to true if you want to only ever return text, never html. This is useful if you have markup like  `<td> 100 <span class="label">cm</span></td>` and would prefer to have `... width: '100 cm', ...` returned, rather than `... width: '100 <span class="label">cm</span>', ...`
* (anything except 'url' or 'textOnly') | These are the attributes of your returned data structure. The values of these parameters **must be jQuery style selectors** (exmaples: `table.locations > tr:last-child > td:last-child`, `title` )

## Why
A lot of websites contain some great data stuck inside html.

## What does it do, exactly?
All it does, is take a URL, and then return structured JSON based on "jQuery style" selectors that you specify.


## What's next?
Immediate thoughts are adding support for:
  - type conversion - grabbing a numerical value could return a JSON number value rather than a string.
  - attribute defaults - some things shouldn't be null if they aren't there.
  - data structures - returning an array of things.
  - booleans - to check for the presence of something vs just returning its value.
