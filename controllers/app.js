// Node Controller to serve up HTML
var contestants = require('../models/Contestant');

exports.index = function(req, res) {
	contestants.find({}, function(err, contestants){
		res.render('app', {
			title: 'Home',
			contestants: contestants
		});
	})
};