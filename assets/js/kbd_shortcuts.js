$(function() {
	// common keyboard keys:
	const KBD_UP = 38;
	const KBD_DOWN = 40;
	const KBD_ESC = 27;


	$(document).on('keyup', null, 'alt+ctrl+shift+x', function(e) {
	if (confirm("Wanna peek into the abyss?")) {
			window.location = $("base").attr('href')+"/secret"
		}
	});

	$(document).on('keyup', null, 'alt+ctrl+shift+s', function(e) {
		$("#site_search").trigger('focus')
	});

	$("#search_div").on('keyup', '#site_search', function(e) {
		switch (e.which) {
			case KBD_DOWN:
				$("#site_search_results li:first a").addClass('active').trigger('focus')
				break
			case KBD_UP:
				$("#site_search_results li:last a").addClass('active').trigger('focus')
				break
			case KBD_ESC:
				$("#site_search_results").hide().empty()
				$("#site_search").val("")
				break
		}
		return false
	})

	$("#site_search_results").on('keydown', '.dropdown-item', function(e) {
		let li_first = $("#site_search_results li").first()
		let li_last = $("#site_search_results li").last()
		let li_curr = $(this).closest("li")

		let tofocus = null
		let posTop = 0
		let posBot = $("#site_search_results").prop('scrollHeight')*2

		switch (e.which) {
			case KBD_DOWN: // down
				tofocus = li_curr.is(li_last) ? li_first : $(li_curr).next()
				break
			case KBD_UP: // up
				tofocus = li_curr.is(li_first) ? li_last : $(li_curr).prev()
				break
			case KBD_ESC: // escape
				tofocus = $("#site_search")
				break;
		}

		if (tofocus != null) {
			if ($(tofocus).is('li')) {
				$(this).removeClass('active')
				$(tofocus).find('.dropdown-item').addClass('active').trigger('focus')

				if ($("#site_search_results li").length > 1) {
					if (tofocus.is(li_first)) {
						$('#site_search_results').animate({scrollTop: posTop}, 10);
					} else if (tofocus.is(li_last)) {
						$('#site_search_results').animate({scrollTop: posBot}, 10);
					}
				}
			} else {
				$('#site_search_results').hide().empty()
				$(tofocus).trigger('focus')
				e.preventDefault()
				e.stopPropagation()
			}
		}
	})
})
