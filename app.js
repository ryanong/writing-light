/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , expressValidator = require('express-validator')
  , mysql = require('mysql')
  , poolModule = require('generic-pool');

var app = express();


// Create a MySQL connection pool with
// a max of 10 connections, a min of 2, and a 30 second max idle time
var pool = poolModule.Pool({
    name     : 'mysql',
    create   : function(callback) {
      var c = mysql.createConnection({
        user:     'root',
        database: 'connecting_light',
        password: '',
        host:     'localhost'
      });

      // parameter order: err, resource
      // new in 1.0.6
      callback(null, c);
    },
    destroy  : function(client) { client.destroy(); },
    max      : 10,
    // optional. if you set this, make sure to drain() (see step 3)
    min      : 2,
    // specifies how long a resource can stay idle in pool before being removed
    idleTimeoutMillis : 30000,
    // if true, logs via console.log - can also be a function
    log : true
});

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(expressValidator);
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', function(req, res){
  req.sanitize('since').toInt();
  req.sanitize('last').toInt();
  req.sanitize('status').toInt();
  req.sanitize('start').toInt();
  req.sanitize('end').toInt();
  req.sanitize('n').toInt();

  var where = []
  if (req.param("since")) {
    where.push("message.id >= " + req.param("since"));
  }
  if (req.param("last")) {
    where.push("message.id <= " + req.param("last"));
  }
  if (req.param("status")) {
    where.push("message.approved = " + req.param("status"));
  }
  if (req.param("start")) {
    where.push("UNIX_TIMESTAMP(postdate) > " + req.param("start"));
  }
  if (req.param("end")) {
    where.push("UNIX_TIMESTAMP(postdate) < " + req.param("end"));
  }

  var sql = "";
  if (where.length > 0) {
    sql += " WHERE " + where.join(" AND ");
  }
  if (req.param("n")) {
    sql += " LIMIT " + req.param("n");
  }


  pool.acquire(function(err, client) {
    if (err) {
      // handle error - this is generally the err from your
      // factory.create function
    }
    else {
      client.query('SELECT message.*, UNIX_TIMESTAMP(postdate) timestamp FROM message' + sql, function(err, rows) {
        // return object back to pool
        pool.release(client);
        if (err) throw err;
        res.json(rows);
      });
    }
  });

});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
