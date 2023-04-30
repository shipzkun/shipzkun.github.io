$(function() {
	$(document).bind('keyup', 'alt+ctrl+shift+x', function(e) {
		if (confirm("Wanna peek into the abyss?")) {
			window.location = $("base").attr('href')+"/secret"
		}
	});

	$(document).bind('keyup', 'alt+ctrl+shift+s', function(e) {
		$("#site_search").trigger('focus')
	});

	$("#site_search").bind('keyup', 'down', function(e) {
		$("#site_search_results li:first a").addClass('active').trigger('focus')
		return false
	});

	$("#site_search").bind('keyup', 'up', function(e) {
		$("#site_search_results li:last a").addClass('active').trigger('focus')
		return false
	});

	$("#site_search_results").on('keydown', '.dropdown-item', function(e) {
		let li_first = $("#site_search_results li").first()
		let li_last = $("#site_search_results li").last()
		let li_curr = $(this).closest("li")

		let tofocus = null
		let posTop = 0
		let posBot = $("#site_search_results").prop('scrollHeight')*2

		switch (e.which) {
			case 40: // down
				tofocus = li_curr.is(li_last) ? li_first : $(li_curr).next()
				break
			case 38: // up
				tofocus = li_curr.is(li_first) ? li_last : $(li_curr).prev()
				break
		}

		if (tofocus != null) {
			$(this).removeClass('active')
			$(tofocus).find('.dropdown-item').addClass('active').trigger('focus')

			if ($("#site_search_results li").length > 1) {
				if (tofocus.is(li_first)) {
					$('#site_search_results').animate({scrollTop: posTop}, 10);
				} else if (tofocus.is(li_last)) {
					$('#site_search_results').animate({scrollTop: posBot}, 10);
				}
			}



			// console.log(posBot, tofocus.is(li_first), tofocus.is(li_last))
		}

	})

	// $("#site_search_results a").bind('keyup', function(e) {
	// 	$(this).closest('li').next().trigger('focus').addClass('active')
	// 	return false
	// });


})
