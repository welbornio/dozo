;(function() {
	var phantom = require('node-phantom'),
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


		var ping = config.ping[0];

		phantom.create(function(err, ph) {

			if (!!err) {
				console.error('phantom.create error:', err);
			}

			console.log('phantom.create success');

			return ph.createPage(function(err, page) {

				if (!!err) {
					console.error('phantom.createPage error:', err);
				}

				console.log('phantom.createpage success');

				return page.open(ping.url, function(err, status) {

					if (!!err) {
						console.error('page.open error', err);
					}

					console.log("page status:", status);

					page.includeJs('https://ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js', function(err) {

						if (!!err) {
							console.error('page.includeJs error:', err)
						}

						setTimeout(function() {

							page.evaluate(function() {

								var article = null,
		  						articles = [],
		  						rules = ping.rules;

						  	$(rules.parent).each(function() {
						  		article = new Article({
							  		title: eval(rules.title),
							  		url: eval(rules.url),
							  		text: eval(rules.text),
							  		img: eval(rules.img)
							  	});
							  	articles.push(article);
						  	});

						  	Article.create(articles, function(err, success) {
						  		if (!!err) {
						  			console.error("inserting into articles error:", err);
						  		}

						  		console.log("inserting into articles success:", success);
						  	});

							}, function(err, result) {

								console.log('page.evaluate result:', result);
								ph.exit();

							});

						}, 5000);

					});

				});

			});

		});

	});

})();
