/*jshint esversion:6 */

var api = require('./api');

api.listen(api.get('port'), function() {
  console.log(`Scrappy is running at localhost: ${api.get('port')}`);
});
