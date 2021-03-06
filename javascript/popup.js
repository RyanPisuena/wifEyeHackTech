var globals = {};


function setTackerTitle() {
	//get hostname
	var t = document.createElement('a')
	t.href = globals.current_tab.url;
	globals.hostname = t.hostname;

	var p = document.getElementById('trackers').firstElementChild;
	p.innerHTML = `${p.innerHTML}<b>${globals.hostname}<b>?`;
}


function getCookie(key) {
	var re = new RegExp(key + "=([^;]+)");
	var val = re.exec(document.cookie);
	return (val != null) ? unescape(val[1]) : null;
}

function setCookie(key, value) {
	document.cookie = `${key}=${value}`;
}

function returnCount() {
	var count = getCookie('clickcount');
	if (count == null) {
		setCookie('clickcount', 1);
	} else {
		setCookie('clickcount', count*1 + 1);
	}
	return count;
}

var count_para = document.getElementById('usage_count');
count_para.firstElementChild.innerHTML = `You ❤️ Wif-eye <b>${returnCount()}</b> times.`;

// BUTTON
var button = document.getElementById('tabmode');
button.onclick = newtab;
console.log('tab-code is running!');

// Tab OnClick
$('li').filter((idx,val) => !val.disabled).each( (idx,val) => {
	val.onclick = function (ev) {
		$('li').filter((idx,val) => !val.disabled).each( (idx,val) => { 
			if( $(`#tab_${val.id}`).length != 0 ){
				$(`#tab_${val.id}`)[0].setAttribute('hidden','');
			}
			val.classList.remove('active');
		});

		if( $(`#tab_${val.id}`).length != 0 ){
			$(`#tab_${val.id}`)[0].removeAttribute('hidden');
		}
		val.classList.add('active');
	}
});


$('#subscription')[0].onclick = function () {
	$('#subscription_img')[0].src ='power-button.svg';
	if( $('#subscription').attr('turnon') == null){
		$('#subscription_img')[0].src ='power-button-green.svg';
		$('#subscription')[0].setAttribute('turnon','');

		setTimeout( ()=>{
			$.get(
				"http://localhost:1338",
				{
					phonenumber: $('#customer').val(),
					cookies: "cookies"
				},
				function(resp) {
					console.log(resp);
				}
			);
		} ,1000);


	}else {
		$('#subscription_img')[0].src ='power-button.svg';
		$('#subscription')[0].removeAttribute('turnon');
	}
}

function newtab() {
	var tab_url = chrome.extension.getURL("cookie.html");
	console.log(tab_url);
	focusOrCreateTab(tab_url);
}

function focusOrCreateTab(url) {
	chrome.windows.getAll({ "populate": true }, function (windows) {
		var existing_tab = null;
		for (var i in windows) {
			var tabs = windows[i].tabs;
			for (var j in tabs) {
				var tab = tabs[j];
				if (tab.url == url) {
					existing_tab = tab;
					break;
				}
			}
		}
		if (existing_tab) {
			chrome.tabs.update(existing_tab.id, { "selected": true });
		} else {
			chrome.tabs.create({ "url": url, "selected": true });
		}
	});
}
function binarySplit(s, sep) {
	var i = s.indexOf(sep);
	return [s.substring(0, i), s.substring(i+1)];
}

function getDomainName(s) {
	var li = s.split(".");
	var strlen = li.length;
	return li[strlen - 2] + '.' + li[strlen - 1];
}

function getHostname(s) {
	var t = document.createElement('a');
  t.href = s;
  return t.hostname;
}

function getCookieKeyValuePair(request) {
	return request.split('; ').map(function(d) {
		return binarySplit(d, '=');
	});
}

function parseWikipediaResponseForExtract(resp) {
	var pages = resp.query.pages;
	return Object.values(pages)[0].extract;
}

// enable popover
function EnablePopOver() {
	$(function () {
	  $('[data-toggle="popover"]').popover({
	  	placement: 'auto',
	  	trigger: 'hover',
	  	html: true
	  })
	})
}

EnablePopOver();

chrome.tabs.getSelected(null, function(tab) {
			var domains = new Set();
			var domainCounts = {};
      console.log(tab);
      var currentTabHostname = getHostname(tab.url);
      console.log(currentTabHostname);
			     	
      chrome.runtime.onMessage.addListener(
			  function(request, sender, sendResponse) {

				globals.current_tab = tab;
				setTackerTitle();
				/*
				setTimeout(()=>{
					chrome.cookies.getAll({ url: `http://${globals.hostname}` }, (info) => {
						info.forEach(d => d3.select('#content').append('p').text(JSON.stringify(d.httpOnly)));
					});
				},2000);*/

			  	console.log(request);
			  	var kvs = getCookieKeyValuePair(request);
			  	
			  	console.log(kvs);
			  	kvs.forEach(kv => {
						var key = kv[0];
						var value = kv[1];
						
				  	chrome.cookies.getAll({ 
				  		name: key
				  	}, function(cookiesThatMatchKey) {
							for (i in cookiesThatMatchKey) {
								var cookie = cookiesThatMatchKey[i];
								if(cookie.value == value)
									console.log(cookie);
								// if cookie matches the key-value pair and it's hostname is not the current tab's hostname

								var cookieDomainName = getDomainName(cookie.domain);
								if(cookie.value == value && !(getDomainName(currentTabHostname) == cookieDomainName)){
									domainCounts[cookieDomainName] = (domainCounts[cookieDomainName] || 0) + 1;
									domains.add(getDomainName(cookie.domain));
								}
							}
				  	});
				  });
			  }
			);

      chrome.tabs.executeScript(tab.id, {code: `
	      chrome.runtime.sendMessage(document.cookie, function(response) {
				  console.log(response);
				});
      `});

      setTimeout(function() {
      	console.log(domains);
      	console.log(domainCounts);
      	if($.isEmptyObject(domainCounts)) {
      		d3.select('#tab_current').remove();
				d3.select('#tab_current2').attr("hidden", null).attr('id','tab_current');
      		return;
      	}

      	

      	var chart = c3.generate({
      			bindto: '#donutchart',
				    data: {
				        columns: Object.entries(domainCounts),
				        type : 'donut',
				        //onclick: function (d, i) { console.log("onclick", d, i); },
				        //onmouseover: function (d, i) { console.log("onmouseover", d, i); },
				        //onmouseout: function (d, i) { console.log("onmouseout", d, i); }
				    },
				    donut: {
				        title: "Donut meets cookies"
				    },
				    tooltip: {
        		format: {
            	value: function (value, ratio, id) {
            		// Show count of cookies for the same domain on tooltip.
                var format = d3.format(',');
                return format(value);
            }
        }
    }
				});

      	domains.forEach(function(domain) {
      		// Get descryption about domain from wikipedia.
      		var s = `https://en.wikipedia.org/w/api.php?&action=query&prop=extracts&exintro=&explaintext=&format=json&titles=${domain.split(".")[0]}`;
      		$.get(
	      		s, 
	      		{paramOne: 1, paramX: 'abc'}, 
	      		function(data) { 
	      			var extract = parseWikipediaResponseForExtract(data);
	      			var content = d3.select('#content');
			      	content.append('span')
			      		.attr("class", "badge badge-primary")
			      		.attr("data-toggle", "popover")
							  .attr("data-content", extract)
							  .on('mouseover', function(d) {
							  	d3.select(this).classed("badge-primary", false);
							  	d3.select(this).classed("badge-secondary", true);
							  })
							  .on('mouseout', function(d) {
							  	d3.select(this).classed("badge-primary", true);
							  	d3.select(this).classed("badge-secondary", false);
							  })
							  .text(domain);
							  
							content.append("br");
							
							EnablePopOver();
	      		}
      		);

	      	
				});
      }, 500);
});
