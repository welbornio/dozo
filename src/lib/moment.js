var moment = require('moment');

module.exports = {
	now: function() {
		return moment().format('MMMM Do YYYY, h:mm:ss a');
	}
};