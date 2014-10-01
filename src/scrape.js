;(function() {
	var phantom = require('phantom'),
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
	
	db.once('open', function(err) {

		if (!!err) {
			console.error("opening db error:", err);
		}

		console.log('running scrape...');

		var Article = mongoose.model('Article', new Schema({
			title: String,
			url: {type: String, unique: true},
			text: String,
			img: String
		}, {collection: 'articles'}));

		async.each(config.ping, function(ping, cb) {

			phantom.create(function(ph) {

				ph.createPage(function(page) {

					page.open(ping.url, function(status) {

						console.log("page status:", status);

						page.includeJs(
							'https://ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js',
							function() {

								page.evaluate(function() {

									var article = null,
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
							  	});

								});

							}, function() {

								cb();
								ph.exit();

							});

					});

				});

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
