var User = require('../models/User');

// Node Controller to serve up HTML
exports.index = function(req, res) {
	User.find({}, function(err, users){
		res.render('app', {
			title: 'Home',
			users: users
		});
	})
};