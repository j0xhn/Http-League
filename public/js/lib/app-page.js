
// item elements
$('.item .person img, .item .person .name').on({
    click: function () {
        $(this).parent().parent().toggleClass('clicked');
    }
});

$('.item .about').on({
    click: function () {
        $(this).parent().toggleClass('clicked');
    }
});

$('.item .record-score').on({
    click: function () {
        $(this).toggleClass('clicked');
    }
});

$('.item .record-score input').on({ // stops it from going up parent tree and registering click to .record-store
	click: function(e){
		e.stopPropagation();
	}
})