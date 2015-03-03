'use strict';

angular.module('HttpLeagueApp', [
	//'ngRoute'
])
// .config(function($interpolateProvider){
//     $interpolateProvider.startSymbol('%$').endSymbol('$%');
// });
// .config(['$routeProvider', function($routeProvider) {
//   $routeProvider.otherwise({ redirectTo: '/' });
// }]);

// controller
angular.module('HttpLeagueApp').controller('RankController',
	[ '$scope'
	, '$window'
	, function ($scope, $window) {
		var RC = this;
		RC.users = window.users;
		RC.user = window.user;
	}]
);