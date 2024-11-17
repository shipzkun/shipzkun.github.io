// constants
const LINKS_HANDLING_OPEN_ALL_SAME_TAB = 'open_all_in_same_tab'
const LINKS_HANDLING_OPEN_INT_SAME_TAB_EXT_OTHER_TAB = 'open_int_same_tab_ext_other_tab'
const LINKS_HANDLING_OPEN_ALL_OTHER_TAB = 'open_all_other_tab'
const LINKS_HANDLING_MODES = [
	LINKS_HANDLING_OPEN_ALL_SAME_TAB,
	LINKS_HANDLING_OPEN_INT_SAME_TAB_EXT_OTHER_TAB,
	LINKS_HANDLING_OPEN_ALL_OTHER_TAB
]

const SETTING_LINKS_HANDLING = 'links_handling'
const RECENT_UPDATES_LIMIT = 10;

const OPEN_EXT = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>';
var SITEMAP = null

$(function() {
	init_showhide_sidebar();

	$(window).resize(init_showhide_sidebar);

	function init_showhide_sidebar() {
		let width_limit_px = 768;
		// console.log(window.innerWidth);
		if (window.innerWidth <= width_limit_px) {
			$("#sidebar").removeClass('show');
			$("#rightbar").hide();
		} else {
			$("#sidebar").addClass('show');
			$("#rightbar").show();
		}
	}

	$("#content").focus().css('outline', 'none');

	$(".can-copy").hover(
		// hover in: show copy button
		function() {
			let id = 'i-'+Math.random()
			let txt = $("<span class='cp-text' id='"+id+"'>").text($(this).text())
			let btn = $("<button class='btn-copy' title='Copy to clipboard' type='button' data-target='"+id+"'>🗒</button>");
			$(this).empty().append(txt).append(btn);
		},
		// hover out: remove copy button
		function() {
			let txt = $(".cp-text").text();
			$(this).empty().text(txt);
		}
	);

	$("body").on("click", ".btn-copy", function() {
		let isIOS = navigator.userAgent.match(/Macintosh|Safari|AppleWebKit/i)

		let btn_parent = $(this).parent();
		let text = $(this).siblings('.cp-text').text();

		let flash_success = function() {
			let info = $('<span class="text text-info">Copied!</span>')
			$(btn_parent).append(info)
			$(info).fadeOut(1000, function() {$(this).remove()})
		}
		let flash_error = function(err) {
			let info = $('<span class="text text-danger">Cannot copy! Error: '+err+'</span>')
			$(btn_parent).append(info)
			$(info).fadeOut(1000, function() {$(this).remove()})
		}

		if (isIOS) {
			let textarea = document.createElement('textarea')
			textarea.value = text
			document.body.appendChild(textarea)
			let range = document.createRange()
			range.selectNodeContents(textarea)
			let selection = window.getSelection()
			selection.removeAllRanges()
			selection.addRange(range)
			textarea.setSelectionRange(0, Number.MAX_SAFE_INTEGER)
			document.execCommand('copy') ? flash_success() : flash_error()
			document.body.removeChild(textarea)
		} else {
			navigator.clipboard.writeText(text).then(flash_success, flash_error);
		}
	});

	$(".tablesorter").tablesorter({
		"headerTemplate": "{content} {icon}", // new in v2.7. Needed to add the bootstrap icon!
		"widthFixed": true,
		"widgets": ["filter"],
		// attribute used by image parser
		"imgAttr": "data-sorttext",
		"textExtraction": {
			".content-html": function(node, table, cellIndex) {
				return $(node).text().replace(/\s+/g, ' ');
			}
		}
	});

	// carousel: do not autoslide
	$('.carousel').carousel({
		interval: false,
	});

	// search for website content
	$("#site_search").on('input', delay(function(e){
		let filter_urls = function() {
			let matches = []
			for (let i in SITEMAP) {
				let url = SITEMAP[i].url.toLowerCase()
				let title = SITEMAP[i].title.toLowerCase()
				let label = SITEMAP[i].label.toLowerCase()
				let categories = SITEMAP[i].categories.toLowerCase().replaceAll('|',' ')
				let tags = SITEMAP[i].tags.toLowerCase().replaceAll('|',' ')

				if (url.indexOf(filter) > -1 ||
					title.indexOf(filter) > -1 ||
					label.indexOf(filter) > -1 ||
					categories.indexOf(filter) > -1 ||
					tags.indexOf(filter) > -1
				) {
					matches = matches.concat(SITEMAP[i])
				}
			}

			return matches
		}

		let show_matches = function(matches, errmsg) {
			let highlight = function(q, text) {
				return text.replaceAll(new RegExp('('+q+')', 'ig'), "<mark>$1</mark>")
			}


			if (errmsg) {
				$("#site_search_results").append("<div class='text-danger'>"+errmsg+"</div>").show()
				return
			}

			if (matches == null || matches.length == 0) {
				$("#site_search_results").append("<div>No results found.</div>").show()
				return
			}

			$("#site_search_results").append('<ul>')
			for (let i in matches) {
				let cats = '';
				let tags = '';
				let labl = '';

				if (matches[i].label.length > 0) {
					labl += make_badge(highlight(filter, matches[i].label), 'label')+' '
				}

				if (matches[i].categories.length > 0) {
					let rcats = matches[i].categories.split('|')
					for (let j in rcats) {
						cats += make_badge(highlight(filter, rcats[j]), 'category')+' '
					}
				}

				if (matches[i].tags.length > 0) {
					let rtags = matches[i].tags.split('|')
					for (let j in rtags) {
						tags += make_badge(highlight(filter, rtags[j]), 'tag')+' '
					}
				}

				let entry = '<li><a class="dropdown-item" href="'+matches[i].url+'" tabindex=0>'+highlight(filter, matches[i].title)
				if (cats.length > 0 || tags.length > 0) {
					entry += '<br/>'+labl+cats+tags
				}
				entry+="</a>"

				$("#site_search_results ul").append(entry)
			}
			update_links(get_setting(SETTING_LINKS_HANDLING))
			$("#site_search_results").show()
		}

		$("#site_search_results").hide()
		$("#site_search_results").empty()

		let filter = $(this).val()
		if (filter == "") {
			return
		}

		filter = filter.trim().toLowerCase()

		if (SITEMAP == null) {
			load_site_pagelist(function() {
				show_matches(filter_urls())
			})
		} else {
			show_matches(filter_urls())
		}
		$("#site_search_results").prepend("<i style='font-size: x-small; position: sticky; top:0; opacity: 0.8' class='bg-secondary'>[Escape] to dismiss</i>")
	}, 600))


	$("input[name="+SETTING_LINKS_HANDLING+"]").on('change', function() {
		update_links($(this).val())
		save_setting(SETTING_LINKS_HANDLING, $(this).val())
	});

	// load saved link handling
	let links_handling = null
	if (storageAvailable('localStorage')) {
		links_handling = get_setting(SETTING_LINKS_HANDLING)
		if (links_handling == null || LINKS_HANDLING_MODES.indexOf(links_handling) < 0) {
			links_handling = LINKS_HANDLING_OPEN_ALL_SAME_TAB
			save_setting(SETTING_LINKS_HANDLING, links_handling)
		}
	}
	update_links(links_handling)
	$("input[name="+SETTING_LINKS_HANDLING+"][value="+links_handling+"]").prop('checked', true)

	$(".toggle_note").click(function(e) {
		e.preventDefault()

		let target = $(this).data('target')

		if (target == "" || $(target).length == 0) return

		$(target).toggle()
	})

	// populate the recent updates list
	let recent_updates_list = $("#recent_updates")
	if (recent_updates_list.length != 0) {
		if (SITEMAP == null) {
			load_site_pagelist(populate_recent_updates_list)
		} else {
			populate_recent_updates_list()
		}
	}
});

function populate_recent_updates_list() {
	let data = SITEMAP
	data.sort((a,b) => {
		d1 = new Date(a.date)
		d2 = new Date(b.date)
		return (d1 <= d2 ? 1 : -1)
	})
	for (let i = 0; i < RECENT_UPDATES_LIMIT; i++) {
		let d = data[i].date.replace('T', ' ').replace('+08:00', ' PST')
		$("#recent_updates").append("<li style='list-style:none'>"+
			make_badge(data[i].label, "category")+
			" <a href='"+data[i].url+"'>"+
				data[i].title+
			"</a> "+
			"<span style='font-size: xx-small'>"+d+"</span>"+
			"</li>"
		)
	}
}

// function that can be used to delay things
function delay(callback, ms) {
	var timer = 0;
	return function() {
		var context = this, args = arguments;
		clearTimeout(timer);
		timer = setTimeout(function () {
			callback.apply(context, args);
		}, ms || 0);
	};
}

function update_links(mode) {
	if (mode == null) return;

	let base_url = $('base').attr('href')

	if (LINKS_HANDLING_MODES.indexOf(mode) < 0) {
		alert('Unrecognised option: '+ mode)
		return
	}

	let set_target = function (node_regex, target) {
		$(node_regex).attr('target', target)

		if (target == '_self') {
			$(node_regex+' svg').remove()
		} else {
			$(node_regex).append(OPEN_EXT)
		}
	}

	// For URLs with leading and trailing spaces, remove
	// Done this way to hopefully only touch wonky urls
	$("a[href^=\\ ], a[href^=\\ ] ").each(function(k,v) {
		let trimmed_url = $(this).attr('href').trim()
		$(this).attr('href', trimmed_url)
	})

	// Remove all external cues
	set_target('a', '_self')

	// apply special cues as applicable
	if (mode == LINKS_HANDLING_OPEN_INT_SAME_TAB_EXT_OTHER_TAB) {
		set_target('a:not([href^="'+base_url+'"])', '_blank')
		// do not mark relative links
		set_target('a:not([href^="http"])', '_self')
	} else if (mode == LINKS_HANDLING_OPEN_ALL_OTHER_TAB) {
		set_target('a', '_blank')
	}

	// a. Do not touch URL fragments
	// b. Do not touch home button
	set_target('a[href^="#"]', '_self')
	set_target('a[href="'+base_url+'"]', '_self')
}

function save_setting(setting, value) {
	if (storageAvailable('localStorage')) {
		localStorage.setItem(setting, value)
	}
}

function get_setting(setting) {
	return localStorage.getItem(setting)
}

// Original code: https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API#feature-detecting_localstorage
function storageAvailable(type) {
	let storage;
	try {
		storage = window[type];
		const x = "__storage_test__";
		storage.setItem(x, x);
		storage.removeItem(x);
		return true;
	} catch (e) {
		return (
			e instanceof DOMException &&
			// everything except Firefox
			(e.code === 22 ||
				// Firefox
				e.code === 1014 ||
				// test name field too, because code might not be present
				// everything except Firefox
				e.name === "QuotaExceededError" ||
				// Firefox
				e.name === "NS_ERROR_DOM_QUOTA_REACHED"
			) &&
			// acknowledge QuotaExceededError only if there's something already stored
			storage &&
			storage.length !== 0
		);
	}
}

function load_site_pagelist(callback) {
	let sitemap_url = $("base").attr('href')+"/links.json";
	$.get(sitemap_url, {}, function(data) {
		SITEMAP = data
		if (typeof callback == 'function') {
			callback()
		}
	}, "json").fail(function(e, status, error) {
		alert('Failed getting index; please contact the developer. ('+status+': '+error+')')
	})
}

function make_badge(text, type) {
	let bclass = '';

	switch (type) {
		case "label": bclass = 'bg-success'; break;
		case "category": bclass = 'bg-primary'; break;
		case "tag": bclass = 'bg-info'; break;
	}
	return '<span class="badge '+bclass+'" style="font-size: xx-small;">'+text+'</span>';
}
