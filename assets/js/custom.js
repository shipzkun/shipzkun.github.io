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
			let id = 'i-'+Math.random();
			let txt = "<span class='cp-text' id='"+id+"'>"+$(this).text()+"</span>";
			let btn = "<button class='btn-copy' title='Copy to clipboard' type='button' data-target='"+id+"'>🗒</button>";
			$(this).html(txt+' '+btn);
		},
		// hover out: remove copy button
		function() {
			let txt = $(".cp-text").text();
			$(this).empty().text(txt);
		}
	);

	$("body").on("click", ".btn-copy", function() {
		let btn_parent = $(this).parent();
		let text = $(this).siblings('.cp-text').text();
		navigator.clipboard.writeText(text).then(function() {
			let info = $('<span class="text text-info">Copied!</span>');
			$(btn_parent).append(info);
			$(info).fadeOut(1000, function() {$(this).remove();});
		}, function(err) {
			let info = $('<span class="text text-danger">Cannot copy!</span>');
			$(btn_parent).append(info);
			$(info).fadeOut(1000, function() {$(this).remove();});
		});
	});

   $(document).bind('keyup', 'alt+ctrl+shift+x', function(e) {
		if (confirm("Wanna peek into the abyss?")) {
			window.location = $("base").attr('href')+"/secret"
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
				return $(node).text();
			}
		}
	});

	// carousel: do not autoslide
	$('.carousel').carousel({
		interval: false,
	});
});
