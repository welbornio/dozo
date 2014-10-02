var phantom = require('phantom'),
	Spooky = require('spooky'),
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

var spooky = new Spooky({
 casper: {
   logLevel: 'error',
   verbose: false,
   options: {
     // clientScripts: ["https://ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js"]
   }
 }
}, function(err) {

	if (!!err) {
		console.error('failed to initialize spooky:', err);
	}

	spooky.start(ping.url);
	spooky.then(function() {
		this.emit('pingDone', this.evaluate(function () {
      return {
      	body: $('body').html(),
      	head: $('head').html()
      }
    }));
	});
	spooky.run();

	spooky.on('error', function(err, stack) {
		console.error('spooky error:', err, stack);
	});

	spooky.on('pingDone', function(greeting) {
		console.log(greeting);
	});

});