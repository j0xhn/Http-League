$(document).ready(function() {

  // Place JavaScript code here...
  $('body').on('submit', 'form.js-record-score', function (ev) {
  	ev.preventDefault();
  	ev.stopPropagation();

  	var form = $(this).closest('form.js-record-score').serialize();
	console.log(form);

	$.ajax( {
	 url: '/app/recordScore/' + $(this).find('.js-record-score-oid').val(),
	 data: form,
	 type: 'post'
	});
  });


});
