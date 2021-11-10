$(document).ready(function() {
	var configs = {
		'clock_class' : 'div_clock',
		'appearance': {
			//frame border:
			'frameborder_out': '1px solid black',
			'frameborder_in': '1px dashed black',
			//frame content:
			'framecontent_background': {
				'scheme':'fixed',
				'colors': {
					'10': '#beffff',
					'11': '#deffff',
					'12': 'lightyellow',
					'00': 'gray',
				},
				'initial': 'lightblue'
			},
			//frame caption:
			'framecaption_border': '1px dashed black',
			'framecaption_background': null,
			'framecaption_color': 'inherit',
			'framecaption_textAlign': 'center',
			'framecaption_font_boldface': true,
			},
			'eventargs' : {
				'daily': {
					'start' : 6,
					'end' : 18,
					'high' : 24,
					'low' : 24
				},
				'special': {
					'condition' : 'random',
					'handler' : 'special_function'
				}
			},
			'sprites' : {
				'month_day' : '-.-',
				'month_night' : '*',
				'daymonth_indicator' : '-',
				// 'daymonth_indicator' : '<sup>-</sup>',
				'daymonth_delimiter' : '&brvbar;',
				'dayweek' : "&nbsp;&nbsp;&nbsp;__<br/>&nbsp;_(&nbsp;&nbsp;)<br/>(__)__)",
				'main_object' : '&nbsp;&nbsp;&nbsp;_<br/>&nbsp;&nbsp;/|\\<br/>&nbsp;/&nbsp;|&nbsp;\\<br/>/__|__\\<br/>___|___<br/>\\_____/'
			}
		};
	clock_start(configs);
});

var clock_containers = null;
var theme = null;
var sprites = null;
var eventargs = null;
function clock_start(configs) {
	//initialize stuff
	if (typeof configs !== 'object') return false;
	if (configs.clock_class === '' ) {
		return false;
	} else {
		clock_containers = document.getElementsByClassName(configs.clock_class);
		theme = configs.appearance;
		sprites = configs.sprites;
		eventargs = configs.eventargs;
		init_container(clock_containers);
	}
		
	//listenees
	var listenees = {
		'per_month': ['update_monthsprite_count'],
		'per_day': ['update_daysprite_count', 'update_dayweeksprite_count','update_monthsprite_display'],
		'per_second': ['update_clock_caption'],
		'per_minute': ['update_mainobj_x', 'update_airsprites_xy'],
		'per_hour' : ['update_framebg', 'update_levels']
	};
	
	clock_tick(listenees);
	
	//we also listen for canvas resize changes
	window.addEventListener('resize', update_levels(new Date()), false);
}

var prev_dt = null;
function clock_tick(listenees) {
	var dt = new Date();
	//we base everything in local time
	var mm = dt.getMonth();
	var dd = dt.getDate();
	var yy = dt.getYear();
	var hh = dt.getHours();
	var ii = dt.getMinutes();
	var ss = dt.getSeconds();
	
	var ms_s = dt.getMilliseconds();
	
	//event order:  monthly-> weekly -> daily -> hourly -> per minute -> per second -> special
	//ORDER IS IMPORTANT! (There are dependent elements, esp. the hour:minute trigger
	//special is only triggered if specified condition is met (set in the configs)
	
	
	
	//monthly:
	if (prev_dt == null || (prev_dt.getMonth() !== mm)) {
		for (var i=0; i<listenees.per_month.length; i++) window[listenees.per_month[i]](dt);
	}
	
	//daily:
	if (prev_dt == null || (prev_dt.getDate() !== dd)) {
		for (var i=0; i<listenees.per_day.length; i++)	window[listenees.per_day[i]](dt, eventargs.daily);
	}
	
	//per hour:
	if (prev_dt == null || (prev_dt.getHours() !== hh)) {
		for (var i=0; i<listenees.per_hour.length; i++)	window[listenees.per_hour[i]](dt);
	} 
	
	//per minute:
	var mintick = false;
	if (prev_dt == null || (prev_dt.getMinutes() !== ii)) {
		for (var i=0; i<listenees.per_minute.length; i++) window[listenees.per_minute[i]](dt);
		mintick = true;
	}
	
	//per second: (this always executes)
	for(var i=0; i<listenees.per_second.length; i++) {
		window[listenees.per_second[i]](dt);
	}
	
	//special event:
	
	//if mintick = true, we change our prev_dt (safest level of granularity we can do this)
	if (mintick) prev_dt = dt;
	
	var ms_e = dt.getMilliseconds();
	var adjustment = parseInt(ms_e, 10) - parseInt(ms_s, 10);
	
	//we "tick"
	window.setTimeout(clock_tick, 1000 - (adjustment), listenees);
}

function init_container(containers) {
	var dt = new Date();
	
	for (var i=0; i<containers.length; i++) {
		containers[i].innerHTML = null;
		//frame size
		containers[i].style.width = '100%';
		containers[i].style.height = '100%';
		
		//outer frame
		containers[i].style.border = theme.frameborder_out;
		
		//inner frame
		var clock_content = document.createElement('div');
		clock_content.style.width = '98%';
		clock_content.style.height = '90%';
		clock_content.style.position = 'relative';
		clock_content.style.top = '2%';
		clock_content.style.margin = 'auto';
		clock_content.style.fontFamily = 'monospace';
		clock_content.style.border = theme.frameborder_in;
		clock_content.style.backgroundColor = theme.framecontent_background.initial;
		clock_content.className = 'clock_content';
		theme.framecontent_currbg = theme.framecontent_background.initial;
		
		//divide the content to three: water, land, sky
		//water:
		var water = document.createElement('div');
		water.className = 'clock_content_water';
		water.style.borderTop = '2px dashed';
		water.style.mixBlendMode = 'difference';
		water.style.width = '100%';
		water.style.position = 'absolute';
		water.style.bottom = '0';
		
		//land: 
		var land = document.createElement('div');
		land.className = 'clock_content_land';
		// land.style.borderBottom = '1px black solid';
		land.style.width = '100%';
		land.style.position = 'absolute';
		
		//air: 
		var air = document.createElement('div');
		air.className = 'clock_content_air';
		// air.style.borderBottom = '1px black double';
		air.style.width = '100%';
		air.style.position = 'absolute';
		air.style.top = '0';
		
		//add the main object (static element)
		var mainobj = get_sprite('main_object');
		mainobj.style.bottom = 0;
		land.appendChild(mainobj);
				
		//add the parts
		clock_content.appendChild(air);
		clock_content.appendChild(land);
		clock_content.appendChild(water);
		
		//frame "caption"
		var clock_caption = document.createElement('div');
		clock_caption.style.position = 'relative';
		clock_caption.style.width = '98%';
		clock_caption.style.height = '5%';
		clock_caption.style.top = '3%';
		clock_caption.style.margin = 'auto';
		clock_caption.style.border = theme.framecaption_border;
		clock_caption.style.color = theme.framecaption_color;
		clock_caption.style.textAlign = theme.framecaption_textAlign;
		if (theme.framecaption_font_boldface) clock_caption.style.fontWeight = 'bold';
		clock_caption.className = 'clock_caption';
		
		//add to main canvas
		containers[i].appendChild(clock_content);
		containers[i].appendChild(clock_caption);
	}
}

function update_clock_caption(dt) {
	var captions = document.getElementsByClassName('clock_caption');
	
	for (var i=0; i<captions.length; i++) {
		captions[i].innerHTML = dt;
	}
}

function update_framebg(dt) {
	var hour = dt.getHours();
	var bg = null;
	
	switch (theme.framecontent_background.scheme) {
		case 'fixed':		
			if (typeof theme.framecontent_background.colors[hour] != 'undefined') {
				bg = theme.framecontent_background.colors[hour];
			}	
			break;
		case 'dynamic':
		
			break;
	}
	
	if (bg == null) return false;
	theme.framecontent_currbg = bg;
	
	//update stuff
	var frame_contents = document.getElementsByClassName('clock_content');
 	var frame_sprites = document.getElementsByClassName('clock_sprite');
	
	//frame background
	for (var i=0; i<frame_contents.length; i++) {
		frame_contents[i].style.backgroundColor = bg;
	}
		
	//we also update the sprite backgrounds
	// for (var i=0; i<frame_sprites.length; i++) {
	// 	frame_sprites[i].style.backgroundColor = bg;
	// }
}

function update_levels(dt) {
	var hour = dt.getHours();
	
	var air = document.getElementsByClassName('clock_content_air');
	var land = document.getElementsByClassName('clock_content_land');
	var water = document.getElementsByClassName('clock_content_water');
	var content = document.getElementsByClassName('clock_content');
	
	//water level: change by 5% per hour. Increase if <=12, decrease if >= 24
	var wh = (hour <=12) ? (hour * 4) : ((24-hour) * 4);
	for (var i=0; i<water.length; i++) water[i].style.height =  wh + '%';

	//land level: max(mainobj.length, daymonth.length)
	var daymonth = document.getElementsByClassName('clock_sprite daymonth')[0];
	var mainobj = document.getElementsByClassName('clock_sprite main_object')[0];
	var dh = daymonth.getBoundingClientRect().height;
	var mh = mainobj.getBoundingClientRect().height;
	// console.log(dh);
	// console.log(mh);
	for (var i=0; i<land.length; i++) {
		// console.log(Math.max(dh, mh));
		// console.log(content[i].getBoundingClientRect().height);
		// console.log(px2perc(Math.max(dh, mh), content[i].getBoundingClientRect().height));
		var lh = px2perc(Math.max(dh, mh), content[i].getBoundingClientRect().height, false);
		// console.log(lh);
		// console.log(wh);
		land[i].style.height = lh + '%'; 
		land[i].style.bottom = wh + '%';
		
		//air level: what is left
		// console.log(lh+wh);
		// console.log((100 - (wh + lh)) + '%');
		air[i].style.height = (100 - (wh + lh)) + '%';
	}
}

function update_mainobj_x(dt) {
	var canvases = document.getElementsByClassName('clock_content');
	
	for (var i=0; i<canvases.length; i++) {
		var dayweek_sprite = canvases[i].getElementsByClassName('clock_sprite daymonth')[0]; 
		var main_object = canvases[i].getElementsByClassName('clock_sprite main_object')[0];
		var space_available = dayweek_sprite.offsetLeft - main_object.offsetWidth;
		var total_space = canvases[i].offsetWidth;
		//move the object n units from the left
		//- (to the left) if minute <30, + (to the right) otherwise
		var increments = Math.floor(space_available/30);
		
		var ii = dt.getMinutes();
		var offset = 0;
		if (ii <=30) offset = -increments*(dt.getMinutes());
		else 		 offset = -increments*(30-(dt.getMinutes()%30));
		
		// main_object.style.left = (((space_available + offset) / space_available)*100) + '%';
		var newpos_px = space_available + offset;
		main_object.style.left = (px2perc(newpos_px, total_space))+'%' ;
	}
}

function update_daysprite_count(dt) {
	var day = dt.getDate();
	
	var newsprite = get_sprite('daymonth', day);
	newsprite.style.position = 'absolute';
	newsprite.style.right = '0';
	newsprite.style.bottom = '0';
	
	var oldsprites = document.getElementsByClassName('clock_sprite daymonth');
	if (oldsprites.length > 0) {
		for (var i=0; i<oldsprites.length; i++) {
			oldsprites[i].parentNode.replaceChild(newsprite.cloneNode(true), oldsprites[i]);
		}
	} else { 
		var content = document.getElementsByClassName('clock_content_land');
		for (var i=0; i<content.length; i++) {
			content[i].appendChild(newsprite.cloneNode(true));
		}
	}
}

function update_dayweeksprite_count(dt) {
	var dayweek = dt.getDay();
		
	var canvases = document.getElementsByClassName('clock_content_air');
	for (var i=0; i<canvases.length; i++) {
		//remove all the existing sprites
		var toremove = canvases[i].getElementsByClassName('clock_sprite dayweek');
		while (toremove[0]) toremove[0].parentNode.removeChild(toremove[0]);
		//add the new sprites
		for (var j=0; j<dayweek; j++) canvases[i].appendChild(get_sprite('dayweek'));
	}
}

function update_monthsprite_count(dt) {
	var month = dt.getMonth();
	var hour = dt.getHours();
	var ismorning = (hour > 6 && hour < 18); // default value; other function should clean up discrepancies
	var canvases = document.getElementsByClassName('clock_content_air');
	for (var i=0; i<canvases.length; i++) {
		//remove all the existing sprites
		var toremove = canvases[i].getElementsByClassName('clock_sprite month');
		while (toremove[0]) toremove[0].parentNode.removeChild(toremove[0]);
		//add the new sprites
		for (var j=0; j<month+1; j++) canvases[i].appendChild(get_sprite('month', ismorning));
	}
}

function update_airsprites_xy() {
	var canvases = document.getElementsByClassName('clock_content_air');
	for (var i=0; i<canvases.length; i++) {
		sprinkle_sprites(canvases[i].getElementsByClassName('clock_sprite'), canvases[i], 20);
	}
}

function update_monthsprite_display(dt, args) {
	var hour = dt.getHours();
	var ismorning = hour >= args.start && hour <= args.end;
	
	var monthsprites = document.getElementsByClassName('clock_sprite month');
	for (var i=0; i<monthsprites.length; i++) {
		monthsprites[i].parentNode.replaceChild(get_sprite('month', ismorning), monthsprites[i]);
	}
}

//"Factory" for sprites
//var sprites is globally defined
function get_sprite(type, typeargs) {
	var obj = null;
	switch (type) {
		case 'month': 
			obj = (typeargs === undefined || typeargs !== true) ? sprites.month_night : sprites.month_day;
			break;
		case 'daymonth':
			obj = sprites.daymonth_indicator;
			if (typeof typeargs == 'number') {
				for (var i=0; i<typeargs-1; i++) obj += sprites.daymonth_indicator;
			}
			obj = sprites.daymonth_delimiter+obj+sprites.daymonth_delimiter;
			break;
		case 'dayweek':
			obj = sprites.dayweek;
			break;
		case 'main_object':
			obj = sprites.main_object;
			break;
		
	}
	
	if (obj === null) return null;
	
	var sprite = document.createElement('div');
	sprite.className = 'clock_sprite '+type;
	sprite.style.position = 'absolute';
	sprite.innerHTML = obj;
	// sprite.style.backgroundColor = 'inherit';
	sprite.style.mixBlendMode = 'difference';
	
	return sprite;
}

// convert pixels to percent
function px2perc(px, ref, with_sign) {
	px = parseInt(px, 10);
	if (!px || !ref) return null;
	
	return ((px/ref) * 100) + (with_sign ? '%' : 0);
}

// "sprinkle" sprites to a canvas
// do not allow overlaps (try attempt_times)
function sprinkle_sprites(sprites, canvas, attempt_times) {
	attempt_times = parseInt(attempt_times, 10);
	if (!sprites || !canvas || !attempt_times) return false;
	
	var rand_range = function(min, max) {
		return Math.floor(Math.random() * (max - min) + min);
	}
	
	var overlapping = function(newelem, others) {
		for (var i=0; i<others.length; i++) {
			if (newelem.offsetWidth > others[i].offsetLeft || 
			    newelem.offsetLeft < others[i].offsetWidth ||
			    newelem.offsetHeight > others[i].offsetTop ||
			    newelem.offsetTop < others[i].offsetHeight
				) return true;
		}
		
		return false;
	}
	
	var curr_sprites = [];
	var hmax = canvas.offsetHeight;
	var wmax = canvas.offsetWidth;
	
	var has_overlap = true;
	for (var i=0; i<sprites.length; i++) {
		sprites[i].style.visibility = 'hidden';
		for (var j=0; j<attempt_times; j++) {
			var t =  rand_range(0, hmax - sprites[i].offsetHeight);
			var h = rand_range(0, wmax - sprites[i].offsetWidth);
			sprites[i].style.top = px2perc(t, hmax, true);
			sprites[i].style.left = px2perc(h, wmax, true);
			
			if (!overlapping(sprites[i], curr_sprites)) {
				curr_sprites[i] = sprites[i];
				has_overlap = false;
				break;
			} 
		}		
	}
	
	//show the sprites in their final positions
	for (var i=0; i<sprites.length; i++) {
		sprites[i].style.visibility = 'visible';	
	}
	return (has_overlap);
}