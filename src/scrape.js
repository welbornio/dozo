var Spooky = require('spooky'),
	async = require('async'),
	jsdom = require('jsdom'),
	mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	config;

config = {
	ping: [
	{
			url: 'http://www.polygon.com/news',
			domain: 'polygon',
			rules: {
				parent: '.block_body',
				title: "$(this).find('h2').text()",
	  		url: "$(this).find('h2 > a').attr('href')",
	  		text: "$(this).find('.copy').text().substr(0, 128)",
	  		img: "$(this).find('.block_img').attr('data-original')"
			}
		},
		{
			url: 'http://bloody-disgusting.com/movies/?f=news',
			domain: 'bloody-disgusting',
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

var Article = mongoose.model('Article', new Schema({
	title: String,
	url: {type: String, unique: true},
	text: String,
	img: String
}, {collection: 'articles'}));


async.each(config.ping, function(ping, cb) {

	var spooky = new Spooky({
	 casper: {
	   logLevel: 'error',
	   verbose: false,
	   options: {
	   	clientScripts: ['https://ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js']
	   }
	 }
	}, function(err) {

		if (!!err) {
			console.error('failed to initialize spooky:', err);
		}

		spooky.start(ping.url);
		spooky.then(function() {
			this.wait(5000, function() {
				this.emit('pingDone', this.evaluate(function() {
	      	return document.getElementsByTagName('body')[0].innerHTML;
	    	}));
			});
		});
		spooky.run();

		spooky.on('error', function(err, stack) {
			console.error('spooky error:', err, stack);
		});

		spooky.on('pingDone', function(html) {
			console.log('pingDone called for '+ping.domain+':', typeof html);
			jsdom.env(
				html,
				['https://ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js'],
				function(err, window) {
					if (!!err) {
						console.error('jsdom error:', err);
					}

					var $ = window.$,
						rules = ping.rules,
						article = null,
						articles = [];

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
			);

		});

	});

});