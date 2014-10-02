var Spooky = require('spooky'),
	mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	async = require('async'),
	config;

config = {
	ping: [
		{
			url: 'http://www.polygon.com/news',
			rules: {
				parent: '.block_body',
				title: "$(this).find('h2').text()",
	  		url: "$(this).find('h2 > a').attr('href')",
	  		text: "$(this).find('.copy').text().substr(0, 128)",
	  		img: "$(this).find('.block_img').attr('data-original')"
			}
		},
		{
			url: 'https://bloody-disgusting.com/movies/?f=news',
			rules: {
				parent: '.archive-list li',
				title: "$(this).find('h2 > a').text()",
	  		url: "$(this).find('h2 > a').attr('href')",
	  		text: "$(this).find('.archive-text > p').text().substr(0, 128)",
	  		img: "$(this).find('img').attr('src')"
			}
		}
	]
};

var ping = config.ping[0];

mongoose.connect('mongodb://localhost/dozo');

var db = mongoose.connection;

db.on('error', function(err) {
	console.error("mongoose connection error:", err);
	process.exit(1);
});

console.log('running scrape...');

var Article = mongoose.model('Article', new Schema({
	title: String,
	url: {type: String, unique: true},
	text: String,
	img: String
}, {collection: 'articles'}));


var spooky = new Spooky({
 	casper: {
   logLevel: 'error',
   verbose: false,
   options: {
     clientScripts: ["https://ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js"]
   }
 }
}, function(err) {

	if (!!err) {
		console.error('failed to initialize spooky:', err);
	}
	else {
		console.log('new spooky created:', ping.url);
	}

	spooky.start(ping.url);
	spooky.then(function() {
		this.emit('pingDone', this.evaluate(function () {

			return 'hi';
			var article = null,
				articles = [],
				rules = ping.rules;

				// $(rules.parent).each(function() {
				// 	article = new Article({
			 //  		title: eval(rules.title),
			 //  		url: eval(rules.url),
			 //  		text: eval(rules.text),
			 //  		img: eval(rules.img)
			 //  	});
			 //  	articles.push(article);
				// });

      return {
      	ping: ping,
      	articles: articles
      };
    }));
	});
	spooky.run();

	spooky.on('error', function(err, stack) {
		console.error('spooky error:', err, stack);
	});

});

spooky.on('console', function (line) {
	console.log(line);
});

spooky.on('pingDone', function(info) {
	console.log('ping done:', info.ping.url);
	Article.create(articles, function(err) {
		if (!!err) {
			console.error("inserting into articles error:", err);
		}
		else {
			mongoose.connection.close();
		}
	});
});
