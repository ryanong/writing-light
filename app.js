/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , mysql = require('mysql');

var app = express();

var client = mysql.createConnection({
  user:     'root',
  database: 'connecting_light',
  password: '',
  host:     'localhost'
});

app.configure(function(){
  app.set('db',client);
  app.set('port', process.env.PORT || 3000);
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', function(req, res){
  app.set('db').query('SELECT message.*, UNIX_TIMESTAMP(postdate) timestamp FROM message', function(err, rows) {
    if (err) throw err;
    res.send(rows);
  });

});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
