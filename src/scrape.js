var Spooky = require('spooky'),
	async = require('async'),
	jsdom = require('jsdom'),
	moment = require('./lib/moment'),
	mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	config,
	originalCount,
	newCount;

config = {
	ping: [
	{
			url: 'http://www.polygon.com/news',
			domain: 'polygon-news',
			tags: [
				'polygon',
				'games',
				'video games',
				'graphics',
				'3D',
				'game development'
			],
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
			domain: 'bloody-disgusting-movie-news',
			tags: [
				'bloody-disgusting',
				'bloody disgusting',
				'movie',
				'movies',
				'horror'
			],
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

Article.count({}, function(err, count) {
	if (!!err) {
		console.error('count error:', err);
	}
	originalCount = count;
});

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
	      	return {
	      		html: document.getElementsByTagName('body')[0].innerHTML
	      	};
	    	}));
			});
		});
		spooky.run();

		spooky.on('error', function(err, stack) {
			console.error('spooky error:', err, stack);
		});

		spooky.on('pingDone', function(info) {

			console.log('pingDone called:', ping);

			jsdom.env(
				info.html,
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
				  	if (
				  			typeof article.title === 'undefined' ||
				  			typeof article.url === 'undefined' ||
				  			typeof article.text === 'undefined' ||
				  			typeof article.img === 'undefined'
				  		) {

				  		console.error('error gathering ping data', ping, article, moment.now());

				  	}
				  	else {

						  articles.push(article);

						}
				  });

				  if (articles.length === 0) {

				  	console.error('ping contained no eligible articles', ping, moment.now());

				  }

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

}, function(err) {
	if (!!err) {
		console.error('async done callback error', err);
	}
	else {
		Article.count({}, function(err, count) {
			if (!!err) {
				console.error('count error:', err);
			}
			newCount = count;
			console.log('scrape complete... inserted '+ (parseInt(newCount) - parseInt(originalCount)) +' articles');
			mongoose.connection.close();
		});
	}
});