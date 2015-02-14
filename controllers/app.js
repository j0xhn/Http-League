var User = require('../models/User');

exports.index = function(req, res) {
	User.find({}).sort({"profile.rank" : 1}).exec(function(err, users){
		res.render('app', {
			title: 'Home',
			users: users
		});
	});
};

