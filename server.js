var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	express = require('express'),
	app = express();

mongoose.connect('mongodb://localhost/dozo');

mongoose.connection.on('error', function(err) {
	console.error("mongoose connection error:", err);
	process.exit(1);
});

var Article = mongoose.model('Article', new Schema({
	title: String,
	url: {type: String, unique: true},
	text: String,
	img: String
}, {collection: 'articles'}));

// Home page
app.get('/', function(req, res) {
	res.sendfile('./client/index.html');
});

// Get all articles
app.get('/articles', function(req, res) {
	Article.find({}, function (err, articles) {
		if (!!err) {
			console.error('querying articles error:', err);
		}
    return res.end(JSON.stringify(articles));
	});
});

// Static files
app.get(/^(.+)$/, function(req, res){ 
  console.log('static file request : ' + req.params);
  res.sendfile( __dirname + req.params[0]); 
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
 	console.log("express server listening on " + port);
});