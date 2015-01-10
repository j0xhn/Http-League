var mongoose = require('mongoose');

var contestantSchema = new mongoose.Schema({
name: String,
rank: String
});

module.exports = mongoose.model('Contestant', contestantSchema);