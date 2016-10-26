/**
 * This script is not fully finished and is not included in the main implementation.
 */


var Client = require('mariasql');

/**
 * Sets client with the following parameters.
 */
var c = new Client({
  host: 'localhost',
  user: 'vn5',
  password: '0!4dt1vE3177X4',
  db: 'vn5_se'
});


function print(){
  c.query('SHOW TABLES', function(err, rows) {
    if (err) console.log(err);

    console.log(rows);
  });
}

/**
 * Adds a record to the database where k is a hash and v is a string
 * representation of the html document.
 */
function addHtmlToPages(){
  var hash = getHash(getHtmlContent());
  var q = 'INSERT INTO pages (k, v) VALUES (' + hash + ' , "' + getHtmlContent() + '" )';

  c.query(q, function(err, rows) {
    if (err)
      console.log(err);
    console.log(rows);
  });

  return hash;
}



function getUrl(hash){
  return "https://mn55.host.cs.st-andrews.ac.uk/news/" + hash;
}

function getHtmlFromPages(hash){
  var q = 'SELECT v FROM pages WHERE k =' + hash;
  c.query(q, function(err, rows) {
    if (err)
      console.log(err);
    console.log(rows);
  });
}

c.end();

//http://erlycoder.com/49/javascript-hash-functions-to-convert-string-into-integer-hash-
//Java String.hashCode() implementation
function getHash(str){
  var hash = 0;

  if (str.length == 0) return hash;

  for (i = 0; i < str.length; i++) {
    char = str.charCodeAt(i);
    hash = ((hash<<5)-hash)+char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return hash;
}

function getHtmlContent(){
  var markup = "<!DOCTYPE html><html>" + "inner html" + "</html>";
  console.log(markup);
  return markup;
}
