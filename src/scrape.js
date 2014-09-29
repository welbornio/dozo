;(function() {
	var curl = require('node-curl'),
		jsdom = require('jsdom'),
		async = require('async'),
		mongoClient = require('mongodb').MongoClient,
		body = null,
		config = null;


	mongoClient.connect("mongodb://localhost:27017/exampleDb", function(err, db) {
		if (!!err) {
			console.log("Error in connecting: ", err);
		}
		else {
			console.log("Success in connecting to mongodb");
		}
	});

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

	console.log('Running scrape...');

	var articles = [];
	async.each(config.ping, function(ping, cb) {
		jsdom.env({
			url: ping.url,
  		scripts: ['http://code.jquery.com/jquery.js'],
  		done: function(err, window) {
	  		if (!!err) {
	  			console.log("Error with handling url: "+ping.url, err);
	  			return;
	  		}

				var $ = window.$
		  		article = null;

		  	var rules = ping.rules;
		  	$(rules.parent).each(function() {
		  		article = {
			  		title: eval(rules.title),
			  		url: eval(rules.url),
			  		text: eval(rules.text),
			  		img: eval(rules.img)
			  	}
		  		articles.push(article);
		  	});
				cb();
	  	}
		});
	}, function(err) {
		if (!!err) {
			console.log("Error in handling pings", err);
			return;
		}

		for (var i = 0; i < articles.length; i++) {
			console.log("Article "+i+": ", articles[i], "\n\n");
		}
	});

})();
