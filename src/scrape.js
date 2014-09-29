;(function() {
	var curl = require('node-curl'),
		jsdom = require('jsdom'),
		async = require('async'),
		mongoose = require('mongoose'),
		Schema = mongoose.Schema,
		body = null,
		config = null;

	config = {
		ping: [
			{
				url: 'https://www.polygon.com/news',
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


	mongoose.connect('mongodb://localhost/dozo');

	var db = mongoose.connection;

	db.on('error', function(err) {
		console.error("connection error:", err);
		process.exit(1);
	});
	db.once('open', function callback () {
		console.log('running scrape...');

		var Article = mongoose.model('Article', new Schema({
			title: String,
			url: String,
			text: String,
			img: String
		}, {collection: 'articles'}));

		async.each(config.ping, function(ping, cb) {
			jsdom.env({
				url: ping.url,
	  		scripts: ['http://code.jquery.com/jquery.js'],
	  		done: function(err, window) {
		  		if (!!err) {
		  			console.error("jsdom error with url: "+ping.url, err);
		  			return;
		  		}

					var $ = window.$
			  		article = null,
			  		articles = [];

			  	var rules = ping.rules;
			  	$(rules.parent).each(function() {
			  		article = new Article({
				  		title: eval(rules.title),
				  		url: eval(rules.url),
				  		text: eval(rules.text),
				  		img: eval(rules.img)
				  	});
				  	articles.push(article);
			  	});

			  	Article.create(articles, function(err) {
			  		if (!!err) {
			  			console.error("inserting into articles error:", err);
			  		}
						cb();
			  	});
		  	}
			});
		}, function(err) {
			if (!!err) {
				console.error("async done callback error:", err);
				return;
			}
			else {
				console.log("completing scrape...");
			}
			mongoose.connection.close();
		});

	});
})();
