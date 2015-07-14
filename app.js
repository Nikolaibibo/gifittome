var express = require('express');
var path = require('path');

var app = express();

// PUBLIC STATIC FILES
app.use(express.static('public'));


// ROUTES
app.get('/', function (req, res, next) {
  res.sendFile(path.join(__dirname, './public', 'index.html'));
});

app.get('/start', function (req, res, next) {
  res.sendFile(path.join(__dirname, './public', 'start.html'));
});



// ERROR HANDLING
app.use(function(req, res, next) {
  res.status(404).send('Sorry cant find that!');
});
app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});



// Server start
var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
