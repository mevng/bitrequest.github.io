//globals
var language = navigator.language || navigator.userLanguage,
	userAgent = navigator.userAgent || navigator.vendor || window.opera,
	phpsupportglobal,
	titlenode = $("title"),
	ogtitle = $("meta[property='og:title']"),
	html = $("html"),
	body = $("body"),
	main = $("main"),
	paymentpopup = $("#payment"),
	paymentdialogbox = $("#paymentdialogbox"),
	funk = $("#funk"), // funk sound effect
	cashier = $("#cashier"), // cashier sound effect
	blip = $("#blip"), // blip sound effect
	waterdrop = $("#waterdrop"), // waterdrop sound effect
	timezoneoffset = new Date().getTimezoneOffset(),
	timezone = timezoneoffset * 60000,
	scrollposition = 0,
	supportsTouch = ("ontouchstart" in window || navigator.msMaxTouchPoints),
	checkcookie = navigator.cookieEnabled,
	referrer,
	referrer = document.referrer,
	isrefferer = (referrer.length > 0),
	is_android_app = (window.matchMedia("(display-mode: standalone)").matches || referrer == "android-app://" + androidpackagename), // android app fingerprint
	is_ios_app = (userAgent == "Mozilla/5.0 (iPhone; CPU iPhone OS 11_0_1 like Mac OS X) AppleWebKit/604.2.10 (KHTML, like Gecko) Version/13.0.3 Safari/605.1.15"), // ios app fingerprint
	inframe = (self !== top),
	offline = (navigator.onLine === false),
	thishostname = location.hostname,
	hostlocation = (thishostname == "app.bitrequest.io") ? "hosted" : 
		(thishostname == localhostname) ? "selfhosted" :
		(thishostname == "") ? "local" : "unknown",
	cp_timer,
	local;

$(document).ready(function() {
	$.ajaxSetup({cache:false});
	gk();
	//proceed
})

function gk() {
	var k = localStorage.getItem("bitrequest_k");
	if (k) {
		sk(atob(k));
		proceed();
	}
	else {
		api_proxy({
			"proxy": true,
			"localhost": false,
			"custom": "gk",
			"api_url": "none",
		}).done(function(e) {
			var ko = e.k;
			if (ko) {
				localStorage.setItem("bitrequest_k", ko);
				sk(atob(ko));
				proceed();
			}
		}).fail(function() {
			proceed();
		});
	}
}

function sk(k) {
	to = JSON.parse(k),
	web3 = new Web3(Web3.givenProvider || main_eth_node + to.if_id);
	if (gapi) {
		gapi_load(); // (lib/oogle_drive_api.js)
	}
}

function init_key_pu(api) {
	var apidata = get_api_data(api),
		sign_up = apidata.sign_up,
		content = "<h2 class='icon-blocked'>Please enter your " + api + " API key</h2><p class='doselect'>To get started enter your key in 'api/keys.php'</p><div id='api_signin'>Get your " + api + " API key <a href='" + sign_up + "' target='blank'>here</a></div>";
	popdialog(content, "alert", "canceldialog");
}

function proceed() {
	if (hostlocation == "selfhosted") { // promt apikey alert when selfhosted
		if (to.ad_id == "") {
			init_key_pu("amberdata");
		}
		else if (to.if_id == "") {
			init_key_pu("infura");
		}
		else if (to.ga_id == "") {
			init_key_pu("google_auth");
		}
	}
	set_icon_boolean();
	buildsettings();
	if (hostlocation != "local") { // don't add service worker on desktop
		add_serviceworker();
	}
	//close potential websockets and pings
	forceclosesocket();
	clearpingtx("close");
	
	//Set classname for ios app	
	if(is_ios_app === true) {
		body.addClass("ios");
	}
	
	//Set classname for iframe	
	if (inframe === true) {
		html.addClass("inframe");
	}
	
	//some api tests first
	if (checkcookie === true) { //check for cookie support
		rendersettings(); //retrieve settings from localstorage (load first to retrieve apikey)
		if (typeof(Storage)) { //check for local storage support
			if (!localStorage.getItem("bitrequest_active")) { //show startpage if no addresses are added
				body.addClass("showstartpage");
			}
			var phpsupport = localStorage.getItem("bitrequest_phpsupport");
			if (phpsupport) {
				phpsupportglobal = (phpsupport == "true" || phpsupport === true) ? true : false;
				setsymbols();
			} else {
				checkphp();
			}
		} else {
			var content = "<h2 class='icon-bin'>Sorry!</h2><p>No Web Storage support..</p>";
			popdialog(content, "alert", "canceldialog");
		}
	} else {
		var content = "<h2 class='icon-bin'>Sorry!</h2><p>Seems like your browser does not allow cookies...<br/>Please enable cookies if you want to continue using this app.</p>";
		popdialog(content, "alert", "canceldialog");
	}	
	$("#fixednav").html($("#relnav").html()); // copy nav
	//startscreen
	setTimeout(function() {
		var startscreen = $("#startscreen");
		startscreen.addClass("hidesplashscreen");
		setTimeout(function() {
			startscreen.remove();
		}, 600);
	}, 600);
}

function set_icon_boolean() {
	var icon_boolean = sessionStorage.getItem("bitrequest_icon_boolean");
	if (icon_boolean == "true" || icon_boolean === true) { //set boolean for random icon pic (getcc_icon);
		sessionStorage.setItem("bitrequest_icon_boolean", false);
	}
	else {
		sessionStorage.setItem("bitrequest_icon_boolean", true);
	}
}

function checkphp() { //check for php support by fetching fiat currencies from local api php file
	api_proxy({
		"api": "fixer",
		"search": "symbols",
		"cachetime": 86400,
		"cachefolder": "1d",
		"proxy": true,
		"localhost": true,
		"params": {
			"method": "GET"
		}
	}).done(function(e) {
		var data = result(e);
		if (data) {
			var symbols = data.symbols;
			if (symbols) {
				if (symbols.USD) {
					localStorage.setItem("bitrequest_symbols", JSON.stringify(symbols));
				} else {
					var content = "<h2 class='icon-bin'>Error</h2><p>Unable to get API data..</p>";
					popdialog(content, "alert", "canceldialog");
				}
			}
			localStorage.setItem("bitrequest_phpsupport", true);
			phpsupportglobal = true;
			setsymbols();
		}
	}).fail(function(jqXHR, textStatus, errorThrown) {
		localStorage.setItem("bitrequest_phpsupport", false);
		phpsupportglobal = false;
		setsymbols();
	});
}

function setsymbols() { //fetch fiat currencies from fixer.io api
	//set globals
	local = (hostlocation == "local" && phpsupportglobal === false);
	apiroot = (phpsupportglobal === false) ? approot : "";
	if (localStorage.getItem("bitrequest_symbols")) {
		geterc20tokens();
	} else {
		api_proxy({
			"api": "fixer",
			"search": "symbols",
			"cachetime": 86400,
			"cachefolder": "1d",
			"params": {
				"method": "GET"
			}
		}).done(function(e) {
			var data = result(e),
				symbols = data.symbols;
			if (symbols.USD) {
				localStorage.setItem("bitrequest_symbols", JSON.stringify(symbols));
			} else {
				var content = "<h2 class='icon-bin'>Error</h2><p>Unable to get API data..</p>";
				popdialog(content, "alert", "canceldialog");
			}
			geterc20tokens();
		}).fail(function(jqXHR, textStatus, errorThrown) {
			var content = "<h2 class='icon-bin'>Api call failed</h2><p class='doselect'>" + textStatus + "<br/>api did not respond</p>";
			popdialog(content, "alert", "canceldialog");
		})
	}
}

//* get top 600 erc20 tokens from coinmarketcap
function geterc20tokens() {
	if (localStorage.getItem("bitrequest_erc20tokens")) {
		setfunctions();
	} else {
		api_proxy({
			"api": "coinmarketcap",
			"search": "cryptocurrency/listings/latest?cryptocurrency_type=tokens&limit=600&aux=cmc_rank,platform",
			"cachetime": 604800,
			"cachefolder": "1w",
			"params": {
				"method": "GET"
			}
		}).done(function(e) {
			var data = result(e);
			if (data.status) {
				if (data.status.error_code === 0) {
					storecoindata(data);
				} else {
					geterc20tokens_local(); // get localy stored coindata
				}
			} else {
				geterc20tokens_local(); // get localy stored coindata
			}
		}).fail(function(jqXHR, textStatus, errorThrown) {
			geterc20tokens_local(); // get localy stored coindata
		}).always(function() {
			setfunctions();
		});
	}
}

function geterc20tokens_local() {
	var apiurl = "assets/data/erc20.json";
	$.getJSON(apiurl, function(data) { // get top 600 tokens from coinmarketcap
		if (data) {
			storecoindata(data);
		}
	}).fail(function(jqXHR, textStatus, errorThrown) {
		var content = "<h2 class='icon-bin'>Api call failed</h2><p class='doselect'>Unable to fetch tokeninfo</p>";
		popdialog(content, "alert", "canceldialog");
	});
}

function storecoindata(data) {
	if (data) {
		var erc20push = [];
		$.each(data.data, function(key, value) {
			var platform = value.platform;
			if (platform) {
				if (platform.id === 1027) { // only get erc20 tokens
					var erc20box = {};
					erc20box.name = value.slug;
					erc20box.symbol = value.symbol.toLowerCase();
					erc20box.cmcid = value.id;
					erc20box.contract = value.platform.token_address;
					erc20push.push(erc20box);
				}
			}
		});
		localStorage.setItem("bitrequest_erc20tokens", JSON.stringify(erc20push));
	}
}

function haspin() {
	var pinsettings = $("#pinsettings").data(),
		pinhash = pinsettings.pinhash;
	if (pinhash) {
		var pinstring = pinhash.toString();
		return (pinstring.length > 3 && pinsettings.locktime != "never");
	}
	else {
		return false;
	}
}

function islocked() {
	var locktime = $("#pinsettings").data("locktime"),
		lastlock = localStorage.getItem("bitrequest_locktime");
	return (geturlparameters().payment) ? false : (haspin() === true && ($.now() - locktime) > lastlock) ? true : false;
}

function setfunctions() {
	setlocales(); //set meta attribute
	settheme();
	
// ** Pincode **

	pinkeypress();
	//pinpressselect
	pinpresstrigger();
	//pinpress
	pinvalidatetrigger();
	//pinvalidate
	pinbacktrigger();
	pinbackvalidatetrigger();
	//pinback
	var pagename = geturlparameters().p;
	if (pagename === undefined || pagename == "home") {
		finishfunctions();
	}
	else {
		if (islocked() === true) {
			var content = pinpanel(" pinwall global");
			showoptions(content, "pin");
			return false;
		} else {
			finishfunctions();
		}
	}
}

function finishfunctions() {
	
// ** IOS Redirects **
	
	//ios_redirections
	//ios_redirect_bitly
	
// ** Intropage **

	starttrigger();
	startnexttrigger();
	//startnext
	//startprev
	lettercountkeydown();
	lettercountinput();
	choosecurrency();
	
// ** Navigation **

	togglenav();
	//loadurl
	clicklink();
	//loadpage
	//openpage
	popstate();
	//loadfunction
	//loadpageevent
	//shownav

// ** Triggerrequest **

	triggertx();
	triggertx_alias();
	//triggertxfunction
	payrequest();
	
// ** UX **

	togglecurrency();
	toggleaddress();
	check_pk();
	toggleswitch();
	showselect();
	selectbox();
	pickselect();
	closeselectbox();
	radio_select();
	dragstart(); // reorder addresses
	//drag
	dragend();
	keyup();
	//escapeandback
	activemenu();
	fixednav();
//notifications
	//notify
	closenotifytrigger();
	//closenotify
	//topnotify
	//popnotify
//dialogs
	//popdialog
	//execute
	addcurrencytrigger();
	//addcurrency
	addaddresstrigger();
	//addaddress
	submitaddresstrigger();
	add_erc20();
	autocomplete_erc20token();
	pickerc20select();
	//initaddressform
	submit_erc20();
	//validateaddress
	//check_address
	canceldialogtrigger();
	//canceldialog
	cancelpaymentdialogtrigger();
	//cancelpaymentdialog
	//closesocket
	//forceclosesocket
	//clearpingtx
	cancelsharedialogtrigger();
	//cancelsharedialog
	showoptionstrigger();
	//showoptions
	newrequest_alias();
	newrequest();
	showrequests();
	editaddresstrigger();
	removeaddress();
	//removeaddressfunction
	showtransaction_trigger();
	showtransactions();
	//open_blockexplorer_url
	//blockexplorer_url
	apisrc_shortcut();
	canceloptionstrigger();
	//canceloptions
	
// ** Requestlist functions **

	showrequestdetails();
	toggle_request_meta();
	show_transaction_meta();
	hide_transaction_meta();
	//animate_confbar
	archive();
	//archivefunction
	unarchive();
	//unarchivefunction
	removerequest();
	//removerequestfunction
	
// ** Helpers **
	
	//get_amberdata_apikey
	//get_infura_apikey
	//api_proxy
	//result
	//get_api_url
	//fetchsymbol
	//fixedcheck
	//geturlparameters
	//markedit
	//triggersubmit
	//copytoclipboard
	//getrandomnumber
	//hashcode
	//loader
	closeloader_trigger();
	//closeloader
	//loadertext
	//chainstate	
	//closechainstate
	//settitle
	//getcc_icon
	//getdevicetype
	//makedatestring
	//returntimestamp
	//weekdays
	//fulldateformat
	//fulldateformatmarkup
	//formattime
	//playsound
	//vibrate
	//get_api_data
	//pinpanel
	//switchpanel
	//getcoindata
	//getcoinsettings
	//try_next_api
	//trimdecimals
	
// ** Page rendering **

	rendercurrencies();
	setTimeout(function() {
		loadurl(); //initiate page
	}, 100);
	//render_currencysettings
	//rendersettings
	renderrequests();
	//fetchrequests
	//initiate
	//buildpage
	//append_coinsetting
	//appendaddress
	//appendrequest
	//amountshort
	editrequest();
	submit_request_description();
	
// ** Store data in localstorage **

	//savecurrencies
	//saveaddresses
	//saverequests
	//savearchive
	//savesettings
	//save_cc_settings
	//updatechanges
	//resetchanges
	//savechangesstats
	renderchanges();
	//change_alert
	//get_total_changes
	
// ** Get_app **
	
	detectapp();
	//getapp
	close_app_panel();
	
// ** Query helpers **
	
	//get_requestli
}

//checks

function setlocales() {
	html.attr("lang", language);
	$("meta[property='og:locale']").attr("content", language);
	$("meta[property='og:url']").attr("content", window.location.href);
	var coindata = getcoindata(geturlparameters().payment),
		imgid = (coindata) ? coindata.cmcid : "1";
	$("meta[property='og:image']").attr("content", "https://s2.coinmarketcap.com/static/img/coins/200x200/" + imgid + ".png");
}

function settheme() {
	$("#theme").attr("href", "assets/styles/themes/" + $("#themesettings").data("selected"));
}

// ** Pincode **

function pinkeypress() {
	$(document).keydown(function(e) {
		var pinfloat = $("#pinfloat");
		if (pinfloat.length) {
			var keycode = e.keyCode;
			if (keycode === 49 || keycode === 97) {
				pinpressselect($("#pin1 > span"));
			} else if (keycode === 50 || keycode === 98) {
				pinpressselect($("#pin2 > span"));
			} else if (keycode === 51 || keycode === 99) {
				pinpressselect($("#pin3 > span"));
			} else if (keycode === 52 || keycode === 100) {
				pinpressselect($("#pin4 > span"));
			} else if (keycode === 53 || keycode === 101) {
				pinpressselect($("#pin5 > span"));
			} else if (keycode === 54 || keycode === 102) {
				pinpressselect($("#pin6 > span"));
			} else if (keycode === 55 || keycode === 103) {
				pinpressselect($("#pin7 > span"));
			} else if (keycode === 56 || keycode === 104) {
				pinpressselect($("#pin8 > span"));
			} else if (keycode === 57 || keycode === 105) {
				pinpressselect($("#pin9 > span"));
			} else if (keycode === 48 || keycode === 96) {
				pinpressselect($("#pin0 > span"));
			} else if (keycode === 8) {
				if (pinfloat.hasClass("enterpin")) {
					pinback($("#pininput"));
				} else {
					pinback($("#validatepin"));
				}
			}
		}
	});
}

function pinpressselect(node) {
	if ($("#pinfloat").hasClass("enterpin")) {
		pinpress(node);
	} else {
		pinvalidate(node)
	}
}

function pinpresstrigger() {
	$(document).on("click touch", "#optionspop .enterpin .pinpad .pincell", function() {
		pinpress($(this));
	});
}

function pinpress(thispad) {
	var pinfloat = $("#pinfloat"),
		thisval = thispad.text(),
		pininput = $("#pininput"),
		pinval = pininput.val(),
		newval = pinval + thisval;
	if (newval.length === 4) {
		if (pinfloat.hasClass("pinwall")) {
			enterapp(newval);
			pininput.val(newval);
			return false;
		} else {
			pininput.val(newval);
			setTimeout(function() {
				pinfloat.addClass("validatepin").removeClass("enterpin");
			}, 100);
			return false;
		}
	}
	if (newval.length > 4) {
		return false;
	}
	pininput.val(newval);
	thispad.addClass("activepad");
	setTimeout(function() {
		thispad.removeClass("activepad");
	}, 500);
	$("#pincode .pinpad").not(thispad).removeClass("activepad");
}

function enterapp(pinval) {
	var pinfloat = $("#pinfloat"),
		savedpin = $("#pinsettings").data("pinhash"),
		hashpin = hashcode(pinval);
	if (hashpin == savedpin) {
		if (pinfloat.hasClass("global")) {
			localStorage.setItem("bitrequest_locktime", $.now());
			finishfunctions();
			setTimeout(function() {
				playsound(waterdrop);
				canceloptions();
			}, 500);
		} else if (pinfloat.hasClass("admin")) {
			localStorage.setItem("bitrequest_locktime", $.now());
			loadpage("?p=currencies");
			$(".currenciesbttn a").addClass("activemenu");
			playsound(waterdrop);
			canceloptions();
		} else if (pinfloat.hasClass("reset")) {
			localStorage.setItem("bitrequest_locktime", $.now());
			$("#pintext").text("Enter new pin");
			pinfloat.removeClass("pinwall reset");
			playsound(waterdrop);
			setTimeout(function() {
				$("#pininput").val("");
			}, 200);
		} else if (pinfloat.hasClass("reset_app")) {
			reset_settings_popup();
			playsound(waterdrop);
			canceloptions();
		} else {
			localStorage.setItem("bitrequest_locktime", $.now());
			playsound(waterdrop);
			canceloptions();
		}
	} else {
		if (navigator.vibrate) {} else {
			playsound(funk);
		}
		pinfloat.addClass("wrongpin");
		setTimeout(function() {
			pinfloat.removeClass("wrongpin");
			$("#pininput").val("");
			vibrate();
		}, 100);
	}
}

function pinvalidatetrigger() {
	$(document).on("click touch", "#optionspop .validatepin .pinpad .pincell", function() {
		pinvalidate($(this))
	});
}

function pinvalidate(thispad) {
	var thisval = thispad.text(),
		pininput = $("#validatepin"),
		pinval = pininput.val(),
		newval = pinval + thisval;
	if (newval.length > 3) {
		if (newval == $("#pininput").val()) {
			var pinsettings = $("#pinsettings"),
				pinhash = hashcode(newval),
				titlepin = "pincode activated",
				locktime = pinsettings.data("locktime");
			pinsettings.data({
				"pinhash": pinhash,
				"locktime": locktime,
				"selected": titlepin
			}).find("p").html(titlepin);
			canceldialog();
			notify("Data saved");
			savesettings();
			playsound(waterdrop);
			canceloptions();
		} else {
			var pinfloat = $("#pinfloat");
			topnotify("pincode does not match");
			if (navigator.vibrate) {} else {
				playsound(funk);
			}
			pinfloat.addClass("wrongpin");
			setTimeout(function() {
				pinfloat.removeClass("wrongpin");
				pininput.val("");
				vibrate();
			}, 200);
		}
	}
	if (newval.length > 4) {
		return false;
	}
	pininput.val(newval);
	thispad.addClass("activepad");
	setTimeout(function() {
		thispad.removeClass("activepad");
	}, 500);
	$("#pincode .pinpad").not(thispad).removeClass("activepad");
}

function pinbacktrigger() {
	$(document).on("click touch", "#optionspop #pinfloat.enterpin #pinback", function() {
		pinback($("#pininput"));
	});
}

function pinbackvalidatetrigger() {
	$(document).on("click touch", "#optionspop #pinfloat.validatepin #pinback", function() {
		pinback($("#validatepin"));
	});
}

function pinback(pininput) {
	var pinval = pininput.val(),
		inputlength = pinval.length,
		prevval = pinval.substring(0, inputlength - 1);
	pininput.val(prevval);
}

// ** IOS Redirects **

// (Can only ben envoked from the IOS app) 

function ios_redirections(url) {
	if (url.endsWith("4bR")) { // handle bitly shortlink
        ios_redirect_bitly(url);
    }
    else {
        var currenturlvar = window.location.href,
			currenturl = currenturlvar.toUpperCase(),
			newpage = url.toUpperCase();
	    if (currenturl == newpage) {
	        // Do nothing
	    } 
	    else {
	        var isrequest = (newpage.indexOf("PAYMENT=") >= 0);
	        if (isrequest === true) {
	            var isopenrequest = (currenturl.indexOf("PAYMENT=") >= 0);
				if (isopenrequest === true) {
					cancelpaymentdialog();
	                setTimeout(function() {
	                    openpage(url, "", "payment");
	                }, 1000);
				}
				else {
					openpage(url, "", "payment");
				}
	        }
	        else {
		        var slice = url.slice(url.lastIndexOf("?p=") + 3),
					pagename = (slice.indexOf("&") >= 0) ? slice.substr(0, slice.indexOf("&")) : slice;
				openpage(url, pagename, "page");
	        }
	    }
    }
}

function ios_redirect_bitly(shorturl) {
	if (hostlocation == "local") {
	}
	else {
		var bitly_id = shorturl.split(approot)[1].split("4bR")[0],
			getcache = sessionStorage.getItem("bitrequest_longurl_" + bitly_id);
		if (getcache) { // check for cached values
			ios_redirections(getcache)
		} else {
			api_proxy({
				"api": "bitly",
				"search": "expand",
				"cachetime": 84600,
				"cachefolder": "1d",
				"bearer": true,
				"params": {
					"method": "POST",
					"contentType": "application/json",
					"data": JSON.stringify({
						"bitlink_id": "bit.ly/" + bitly_id
					})
				}
			}).done(function(e) {
				var data = result(e);
				if (data.error) {
					fail_dialogs("bitly", data.error);
				}
				else {
					if (data) {
						var longurl = data.long_url;
						if (longurl) {
							ios_redirections(longurl);
							sessionStorage.setItem("bitrequest_longurl_" + bitly_id, longurl); //cache token decimals
						}
						else {
							window.location.href = "http://bit.ly/" + bitly_id;
						}
					}
				}
			}).fail(function(jqXHR, textStatus, errorThrown) {
				window.location.href = "http://bit.ly/" + bitly_id;
			});
		}
	}
}

// ** Intropage **

function starttrigger() {
	$(document).on("click touch", "#intro", function() {
		startnext($(this));
	});
}

function startnexttrigger() {
	$(document).on("click touchend", "#entername .panelwrap", function(e) {
		if (e.target == this) {
			startnext($("#entername"));
		}
	});
}

function startnext(thisnode) {
	var thisnext = thisnode.attr("data-next"),
		nameinput = $("#eninput");
	if (thisnext === undefined) {
		return false;
	} else if (thisnode.hasClass("validstep")) {
		$("#startpage").attr("class", "sp_" + thisnext);
		thisnode.removeClass("panelactive").next(".startpanel").addClass("panelactive");
		nameinput.blur();
	} else {
		topnotify("Please enter your name");
	}
}

function startprev(thisnode) {
	var thisprev = thisnode.attr("data-prev");
	if (thisprev === undefined) {
		return false;
	} else {
		$("#startpage").attr("class", "sp_" + thisprev);
		thisnode.removeClass("panelactive").prev(".startpanel").addClass("panelactive");
		$("#eninput").blur();
	}
}

function lettercountkeydown() { // Character limit on input field
	$(document).on("keydown", "#eninput", function(e) {
		var keycode = e.keyCode,
			thisinput = $(this),
			thisvallength = thisinput.val().length,
			lettersleft = thisinput.attr("data-max") - thisvallength;
		if (keycode === 13) {
			startnext($("#entername"));
		}
		if (keycode === 8 || keycode === 39 || keycode === 37 || keycode === 91 || keycode === 17 || e.metaKey || e.ctrlKey) { //alow backspace, arrowright, arrowleft, command, ctrl
		} else {
			if (lettersleft === 0) {
				playsound(funk);
				e.preventDefault();
			}
		}
	});
}

function lettercountinput() { // Character count plus validation
	$(document).on("input", "#eninput", function() {
		var thisinput = $(this),
			mininput = thisinput.attr("data-min"),
			thispanel = $("#entername"),
			thisvallength = thisinput.val().length,
			lettersleft = thisinput.attr("data-max") - thisvallength,
			lettercount = $("#lettercount");
		lettercount.text(lettersleft);
		if (thisvallength >= mininput) {
			thispanel.addClass("validstep");
		} else {
			thispanel.removeClass("validstep");
		}
		if (thisvallength < 1) {
			lettercount.removeClass("activlc");
		} else {
			lettercount.addClass("activlc");
		}
	});
}

function choosecurrency() {
	$(document).on("click touch", "#allcurrencies li.choose_currency", function() {
		var currency = $(this).attr("data-currency"),
			cd = getcoindata(currency);
		addcurrency({
			"currency": currency,
			"ccsymbol": cd.ccsymbol,
			"cmcid": cd.cmcid,
			"erc20": false,
			"checked": true
		});
		return false;
	})
}

// ** Navigation **

function togglenav() {
	$(document).on("click touch", "#header", function(e) {
		e.preventDefault();
		if (html.hasClass("showmain")) {
			loadpage("?p=home");
			$(".navstyle li a").removeClass("activemenu");
		} else {
			if (islocked() === true) {
				var content = pinpanel(" pinwall admin");
				showoptions(content, "pin");
				return false;
			} else {
				loadpage("?p=currencies");
				$(".currenciesbttn a").addClass("activemenu");
			}
		}
	});
}

function loadurl() {
	var gets = geturlparameters(),
		page = gets.p,
		payment = gets.payment,
		url = window.location.search,
		event = (payment) ? "both" : "loadpage";
	if (url) {
		openpage(url, page, event);
	} else {
		loadpageevent("home");
	}
	shownav(page);
}

function clicklink() {
	$(document).on("click touch", ".self", function(e) {
		e.preventDefault();
		loadpage($(this).attr("href"));
		return false
	})
}

//push history and set current page
function loadpage(href) {
	var presplit = href.split("&")[0],
		split = presplit.split("="),
		pagename = split.pop();
	openpage(href, pagename, "loadpage");
	if (body.hasClass("edited")) {
		savecurrencies();
		body.removeClass("edited")
	}
	if (body.hasClass("addressedited")) {
		saveaddresses(body.data("currency"));
		body.removeClass("addressedited").data("currency", "");
	}
	if (body.hasClass("showsatedited")) {
		save_cc_settings(body.data("currency"));
		body.removeClass("showsatedited").data("currency", "");
	}
}

function openpage(href, pagename, event) {
	history.pushState({
		pagename: pagename,
		event: event
	}, "", href);
	loadfunction(pagename, event);
}

function popstate() {
	window.onpopstate = function(e) {
		var statemeta = e.state;
		if (statemeta.pagename) { //check for history
			loadfunction(statemeta.pagename, statemeta.event);
		} else {
			cancelpaymentdialog();
			e.preventDefault();
			return false;
		}
	}
}
//activate page
function loadfunction(pagename, thisevent) {
	if (thisevent == "payment") { //load paymentpopup if payment is set
		loadpaymentfunction();
	} else if (thisevent == "both") { //load paymentpopup if payment is set and load page
		loadpageevent(pagename);
		setTimeout(function() {
			loadpaymentfunction("delay");
		}, 1000);
	} else {
		loadpageevent(pagename);
		var title = pagename + " | " + apptitle;
		settitle(title);
		if (paymentpopup.hasClass("active")) {
			cancelpaymentdialog();
		}
	}
}

function loadpageevent(pagename) {
	$("html, body").animate({
		scrollTop: 0
	}, 400);
	var currentpage = $("#" + pagename);
	currentpage.addClass("currentpage");
	$(".page").not(currentpage).removeClass("currentpage");
	$(".highlightbar").attr("data-class", pagename);
	shownav(pagename);
	var requestfilter = geturlparameters().filteraddress; // filter requests if filter parameter exists
	if (requestfilter && pagename == "requests") {
		$("#requestlist > li").not(get_requestli("address", requestfilter)).hide();
	}
	else {
		$("#requestlist > li").show();
	}
}

function shownav(pagename) { // show / hide navigation
	if (!pagename || pagename == "home") {
		html.removeClass("showmain").addClass("hidemain");
		$("#relnav .nav").slideUp(300);
	} else {
		html.addClass("showmain").removeClass("hidemain")
		$("#relnav .nav").slideDown(300);
	}
}

// ** Triggerrequest **

function triggertx() {
	$(document).on("click touch", "#currencylist li a", function(e) {
		e.preventDefault();
		triggertxfunction($(this));
	});
}

function triggertx_alias() {
	$(document).on("click touch", "#alias_currencylist li a", function(e) {
		e.preventDefault();
		triggertxfunction($(this));
		canceloptions();
	});
}

function triggertxfunction(thislink) {
	var currency = thislink.data("currency"),
		thisaddress = $("#" + currency + ".page ul.pobox li[data-checked='true']").data("address"),
		cd = getcoindata(currency),
		currencysettings = $("#currencysettings").data(),
		c_default = currencysettings.default;
		currencysymbol = (c_default === true && offline === false) ? currencysettings.currencysymbol : cd.ccsymbol,
		title = thislink.attr("title"),
		savedurl = thislink.data("url"),
		currentpage = geturlparameters().p,
		currentpage_correct = (currentpage) ? "?p=" + currentpage + "&payment=" : "?payment=";
		prefix = currentpage_correct + currency + "&uoa=",
		newlink = prefix + currencysymbol + "&amount=0" + "&address=" + thisaddress,
		href = (!savedurl || offline !== false) ? newlink : savedurl; //load saved url if exists
	localStorage.setItem("bitrequest_editurl", href); // to check if request is being edited
	remove_flip(); // reset request card facing front
	openpage(href, title, "payment");
}

function payrequest() {
	$(document).on("click touch", "#requestlist .req_actions .icon-qrcode, #requestlist .payrequest", function(e) {
		e.preventDefault();
		var thisnode = $(this);
		if (offline === true && thisnode.hasClass("isfiat")) {
			// do not trigger fiat request when offline because of unknown exchange rate
			notify("Unable to get exchange rate");
		}
		else {
			var thisrequestlist = thisnode.closest("li.rqli"),
				rldata = thisrequestlist.data(),
				rl_payment = rldata.payment,
				rl_uoa = rldata.uoa,
				rl_status = rldata.status,
				rl_requesttype = rldata.requesttype,
				rl_amount = rldata.amount,
				rl_receivedamount = rldata.receivedamount,
				rl_fiatvalue = rldata.fiatvalue,
				rl_iscrypto = rldata.iscrypto,
				rl_uoa = rldata.uoa,
				insufficient = (rl_status == "insufficient"),
				midstring = thisnode.attr("data-href"),
				endstring = "&status=" + rl_status + "&type=" + rl_requesttype,
				amount_short_rounded = amountshort(rl_amount, rl_receivedamount, rl_fiatvalue, rl_iscrypto),
				paymenturl_amount = (insufficient === true) ? amount_short_rounded : rl_amount,
				paymenturl = "?p=requests&payment=" + rl_payment + "&uoa=" + rl_uoa + "&amount=" + paymenturl_amount + midstring + endstring;
			openpage(paymenturl, "", "payment");
		}
		return false;
	});
}

// ** UX **

function togglecurrency() {
	$(document).on("click touch", ".togglecurrency", function() {
		var parentlistitem = $(this).closest("li"),
			coindata = parentlistitem.data(),
			currency = coindata.currency,
			checked = coindata.checked,
			currencylistitem = $("#currencylist > li[data-currency='" + currency + "']");
		if (checked === true) {
			parentlistitem.attr("data-checked", "false").data("checked", false);
			currencylistitem.addClass("hide");
		} else {
			var lscurrency = localStorage.getItem("bitrequest_cc_" + currency);
			if (lscurrency) {
				var addresslist = $("main #" + currency + " .content ul.pobox[data-currency='" + currency + "']"),
					addresscount = addresslist.find("li[data-checked='true']").length;
				if (addresscount == 0) {
					addresslist.find("li[data-checked='false']").first().find(".toggleaddress").trigger("click");
				} else {
					parentlistitem.attr("data-checked", "true").data("checked", true);
					currencylistitem.removeClass("hide");
				}
			} else {
				addcurrency(coindata);
			}
		}
		markedit();
	});
}

function toggleaddress() {
	$(document).on("click touch", ".toggleaddress", function() {
		var parentlistitem = $(this).closest("li"),
			checked = parentlistitem.data("checked"),
			parentlist = parentlistitem.closest("ul.pobox"),
			addresscount = parentlist.find("li[data-checked='true']").length,
			currency = parentlist.attr("data-currency"),
			currencylistitem = $("#currencylist > li[data-currency='" + currency + "']"),
			parentcheckbox = $("#usedcurrencies li[data-currency='" + currency + "']");
		if (checked === true || checked == "true") {
			parentlistitem.attr("data-checked", "false").data("checked", false);
			if (addresscount === 1) {
				currencylistitem.addClass("hide");
				parentcheckbox.attr("data-checked", "false").data("checked", false);
				markedit();
			}
		} else {
			parentlistitem.attr("data-checked", "true").data("checked", true);
			if (addresscount == 0) {
				currencylistitem.removeClass("hide");
				parentcheckbox.attr("data-checked", "true").data("checked", true);
				markedit();
			}
		}
		if (body.hasClass("addressedited")) {} else {
			body.addClass("addressedited");
			body.data("currency", currency);
		}
	});
}

function check_pk() {
	$(document).on("click touch", "#pk_confirmwrap", function() {
		var thisnode = $(this),
			checked = thisnode.data("checked");
		if (checked == true) {
			thisnode.attr("data-checked", "false").data("checked", false);
		} else {
			thisnode.attr("data-checked", "true").data("checked", true);
		}
	});
}

function toggleswitch() {
	$(document).on("click touch", ".switchpanel.global", function() {
		var thistoggle = $(this);
		if (thistoggle.hasClass("true")) {
			thistoggle.removeClass("true").addClass("false");
		} else {
			thistoggle.removeClass("false").addClass("true");
		}
	})
}

// ** Selectbox **

function showselect() {
	$(document).on("click touch", ".selectarrows", function() {
		var options = $(this).next(".options");
		if (options.hasClass("showoptions")) {
			options.removeClass("showoptions");
		} else {
			options.addClass("showoptions");
		}
	});
}

function selectbox() {
	$(document).on("click touch", ".selectbox > input:not([readonly])", function() {
		//return false;
		var thisselect = $(this),
			thisvalue = thisselect.val(),
			options = thisselect.parent(".selectbox").find(".options span");
		if (options.hasClass("show")) {
			options.removeClass("show");
		} else {
			options.filter(function() {
				return $(this).text() != thisvalue;
			}).addClass("show");
		}
	})
}

function pickselect() {
	$(document).on("click touch", ".selectbox > .options span", function() {
		var thisselect = $(this),
			thisvalue = thisselect.text(),
			selectbox = thisselect.closest(".selectbox"),
			thisinput = selectbox.children("input");
		thisinput.val(thisvalue);
		selectbox.find(".options").removeClass("showoptions").children("span").removeClass("show");
	})
}

function closeselectbox() {
	$("#popup .selectbox .options").removeClass("showoptions");
}

function radio_select() {
	$(document).on("click touch", ".formbox .pick_conf", function() {
		var thistrigger = $(this),
			thisradio = thistrigger.find(".radio");
		if (thisradio.hasClass("icon-radio-unchecked")) {
			$(".formbox .conf_options .radio").not(thisradio).removeClass("icon-radio-checked2").addClass("icon-radio-unchecked")
			thisradio.removeClass("icon-radio-unchecked").addClass("icon-radio-checked2");
		} else {
			thisradio.removeClass("icon-radio-checked2").addClass("icon-radio-unchecked");
		}
		var thisvalue = thistrigger.children("span").text(),
			thisinput = $(".formbox input:first");
		thisinput.val(thisvalue);
	})
}

// ** Reorder Adresses **

function dragstart() {
	$(document).on("mousedown touchstart", ".currentpage .applist li .popoptions", function(e) {
		e.preventDefault();
		var thislist = $(this).closest("li");
		thislist.addClass("dragging");
		var dialogheight = thislist.height();
		var startheight = e.originalEvent.touches ? e.originalEvent.touches[0].pageY : e.pageY;
		drag(thislist, dialogheight, startheight, thislist.index());
	})
}

function drag(thislist, dialogheight, startheight, thisindex) {
	$(document).on("mousemove touchmove", ".currentpage .applist li", function(e) {
		e.preventDefault();
		html.addClass("dragmode");
		var currentheight = e.originalEvent.touches ? e.originalEvent.touches[0].pageY : e.pageY;
		var dragdistance = currentheight - startheight;
		thislist.addClass("dragging").css({
			"-webkit-transform": "translate(0, " + dragdistance + "px)"
		});
		$(".currentpage .applist li").not(thislist).each(function(i) {
			var thisli = $(this),
				thisoffset = thisli.offset().top,
				thisheight = thisli.height(),
				hoverpoint = thisoffset + (thisheight / 2),
				dragup = (i + 1 > thisindex) ? true : false;
			if (dragup === true) {
				if (currentheight > hoverpoint) {
					thisli.css({
						"-webkit-transform": "translate(0, -" + dialogheight + "px)"
					}).addClass("hovered")
					thislist.addClass("after").removeClass("before");
				} else {
					thisli.css({
						"-webkit-transform": "translate(0, 0)"
					}).removeClass("hovered")
				}
			} else {
				if (currentheight < hoverpoint) {
					thisli.css({
						"-webkit-transform": "translate(0, " + dialogheight + "px)"
					}).addClass("hovered")
					thislist.addClass("before").removeClass("after");
				} else {
					thisli.css({
						"-webkit-transform": "translate(0, 0)"
					}).removeClass("hovered")
				}
			}
		});
	})
}

function dragend() {
	$(document).on("mouseup mouseleave touchend", ".currentpage .applist li", function() {
		$(document).off("mousemove touchmove", ".currentpage .applist li");
		var thisunit = $(this).closest("li");
		if (thisunit.hasClass("dragging")) {
			if (thisunit.hasClass("before")) {
				thisunit.insertBefore(".hovered:first");
			} else if (thisunit.hasClass("after")) {
				thisunit.insertAfter(".hovered:last");
			}
			thisunit.removeClass("before after dragging").attr("style", "");
			$(".currentpage .applist li").removeClass("hovered").attr("style", "");
			html.removeClass("dragmode");
			if (body.hasClass("addressedited")) {} else {
				body.addClass("addressedited");
				body.data("currency", geturlparameters().p);
			}
		}
	})
}

function keyup() {
	$(document).keyup(function(e) {
		if (e.keyCode == 39) {
			if (body.hasClass("showstartpage")) {
				e.preventDefault();
				startnext($(".panelactive"));
			}
		}
		if (e.keyCode == 37) {
			if (body.hasClass("showstartpage")) {
				e.preventDefault();
				startprev($(".panelactive"));
			}
		}
		if (e.keyCode == 27) {
			escapeandback();
		}
		if (e.keyCode == 13) {
			if ($("#popup").hasClass("active")) {
				$("#popup #execute").trigger("click");
			}
		}
	});
}

function escapeandback() {
	if ($("#loader").hasClass("active")) {
		closeloader();
		return false;
	}
	if ($("#sharepopup").hasClass("active")) {
		cancelsharedialog();
		return false;
	}
	if ($("#notify").hasClass("popup")) {
		closenotify();
		return false;
	}
	if ($("#popup .selectbox .options").hasClass("showoptions")) {
		closeselectbox();
		return false;
	}
	if ($("#popup").hasClass("active")) {
		canceldialog();
		return false;
	}
	if ($("#optionspop").hasClass("active")) {
		canceloptions();
		return false;
	}
	if (body.hasClass("showstartpage")) {
		startprev($(".panelactive"));
	}
	if (paymentpopup.hasClass("active")) {
		if (paymentdialogbox.hasClass("flipped") && paymentdialogbox.hasClass("norequest")) {
			remove_flip();
		}
		else {
			if (html.hasClass("firstload")) {
				var pagename = geturlparameters().p,
					set_pagename = (pagename) ? pagename : "home";
				openpage("?p=" + set_pagename, set_pagename, "loadpage");
			} else {
				window.history.back();
			}
		}
		return false;
	} else {
		window.history.back();
	}
}

function activemenu() {
	$(document).on("click touch", ".nav li a", function() {
		var thisitem = $(this);
		thisitem.addClass("activemenu");
		$(".nav li a").not(thisitem).removeClass("activemenu");
		return false
	})
}

function fixednav() {
	$(document).scroll(function(e) {
		if (html.hasClass("paymode")) {
			e.preventDefault();
			return false
		} else {
			fixedcheck($(document).scrollTop());
		}
	});
}

//notifications
function notify(message, time, showbutton) {
	//return false;
	var settime = (time) ? time : 4000,
		setbutton = (showbutton) ? showbutton : "no",
		notify = $("#notify");
	$("#notifysign").html(message + "<span class='icon-cross'></div>").attr("class", "button" + setbutton);
	notify.addClass("popupn");
	var timeout = setTimeout(function() {
		closenotify();
	}, settime, function() {
		clearTimeout(timeout);
	});
}

function closenotifytrigger() {
	$(document).on("click touch", "#notify .icon-cross", function() {
		closenotify()
	});
}

function closenotify() {
	$("#notify").removeClass("popupn");
}

function topnotify(message) {
	var topnotify = $("#topnotify");
	topnotify.text(message).addClass("slidedown");
	var timeout = setTimeout(function() {
		topnotify.removeClass("slidedown");
	}, 7000, function() {
		clearTimeout(timeout);
	});
}

function popnotify(result, message) {
	var notify = $(".popnotify");
	if (result == "error") {
		notify.removeClass("success warning").addClass("error");
	} else if (result == "warning") {
		notify.removeClass("success error").addClass("warning");
	} else {
		notify.addClass("success").removeClass("error warning");
	}
	notify.slideDown(200).html(message);
	var timeout = setTimeout(function() {
		notify.slideUp(200);
	}, 6000, function() {
		clearTimeout(timeout);
	});
}

//dialogs
function popdialog(content, type, functionname, trigger) {
	$("#dialogbody").append(content);
	body.addClass("blurmain");
	$("#popup").addClass("active showpu");
	var thistrigger = (trigger) ? trigger : $("#popup #execute");
	if (functionname) {
		execute(thistrigger, functionname);
	}
	if (supportsTouch === true) {
	}
	else {
		$("#dialogbody input:first").focus();
	}
}

function execute(trigger, functionname) {
	$(document).on("click touch", "#execute", function(e) {
		e.preventDefault();
		eval(functionname + "(trigger)");
		return false
	})
}

function addcurrencytrigger() {
	$(document).on("click touch", ".addcurrency", function() {
		addcurrency($(this).closest("li").data());
		return false;
	})
}

function addcurrency(cd) {
	var currency = cd.currency,
		thiscurrencylink = "?p=" + cd.currency;
	if ($("main #" + currency + " .content ul.pobox[data-currency='" + currency + "'] li").length) {
		loadpage(thiscurrencylink);
	} else {
		addaddress(cd, false);
	}
}

function addaddresstrigger() {
	$(document).on("click touch", ".addaddress", function() {
		addaddress($("#" + $(this).attr("data-currency")).data(), false);
	})
}

function addaddress(ad, edit) {
	var currency = ad.currency,
		cpid = ad.ccsymbol + "-" + currency,
		address = (ad.address) ? ad.address : "",
		label = (ad.label) ? ad.label : "",
		title = (edit === true) ? "<h2 class='icon-pencil'>Edit label</h2>" : "<h2>" + getcc_icon(ad.cmcid, cpid, ad.erc20) + " Add " + currency + " address</h2>",
		pk_checkbox = (edit === true) ? "" : "<div id='pk_confirm' class='noselect'><div id='pk_confirmwrap' data-checked='false'><span class='checkbox'></span></div><span>I own the seed / private key of this address</span></div>",
		addeditclass = (edit === true) ? "edit" : "add",
		content = $("<div class='formbox form" + addeditclass + "' id='addressformbox'>" + title + "<div class='popnotify'></div><form class='addressform popform'><input type='text' class='address' value='" + address + "' placeholder='Enter a " + currency + " address'><input type='text' class='addresslabel' value='" + label + "' placeholder='label'>" + pk_checkbox + "<input type='submit' class='submit' value='OK'></form>").data(ad);
	popdialog(content, "alert", "triggersubmit");
	if (supportsTouch === true) {
	}
	else {
		if (edit === true) {
			$("#popup input.addresslabel").focus().select();
		}
		else {
			$("#popup input.address").focus();
		}
	}
}

function submitaddresstrigger() {
	$(document).on("click touch", "#addressformbox input.submit", function(e) {
		e.preventDefault();
		validateaddress($(this).closest("#addressformbox"));
	})
}

//Add erc20 token
function add_erc20() {
	$(document).on("click touch", "#add_erc20, #choose_erc20", function() {
		var tokenobject = JSON.parse(localStorage.getItem("bitrequest_erc20tokens")),
			tokenlist = "";
		$.each(tokenobject, function(key, value) {
			tokenlist += "<span data-id='" + value.cmcid + "' data-currency='" + value.name + "' data-ccsymbol='" + value.symbol.toLowerCase() + "' data-contract='" + value.contract + "'>" + value.symbol + " | " + value.name + "</span>";
		});
		var nodedata = {
				"erc20": true,
				"monitored": true,
				"checked": true
			},
			content = $("\
			<div class='formbox' id='erc20formbox'>\
				<h2 class='icon-coin-dollar'>Add erc20 token</h2>\
				<div class='popnotify'></div>\
				<form id='addressform' class='popform'>\
					<div class='selectbox'>\
						<input type='text' value='' placeholder='Pick erc20 token' id='ac_input'/>\
						<div class='selectarrows icon-menu2'></div>\
						<div id='ac_options' class='options'>" + tokenlist + "</div>\
					</div>\
					<div id='erc20_inputs'>\
					<input type='text' class='address' value='' placeholder='Enter a address'/>\
					<input type='text' class='addresslabel' value='' placeholder='label'/>\
					<div id='pk_confirm' class='noselect'>\
						<div id='pk_confirmwrap' data-checked='false'>\
							<span class='checkbox'></span>\
						</div>\
						<span>I own the seed / private key of this address</span>\
					</div></div>\
					<input type='submit' class='submit' value='OK'/>\
				</form>").data(nodedata);
		popdialog(content, "alert", "triggersubmit");
	})
}

function autocomplete_erc20token() {
	$(document).on("input", "#ac_input", function() {
		var thisinput = $(this),
			thisform = thisinput.closest("form");
		thisform.removeClass("validated");
		var thisvalue = thisinput.val().toLowerCase(),
			options = thisform.find(".options");
		$("#ac_options > span").each(function(i) {
			var thisoption = $(this);
			thisoption.removeClass("show");
			var thistext = thisoption.text(),
				currency = thisoption.attr("data-currency"),
				currencysymbol = thisoption.attr("data-ccsymbol"),
				contract = thisoption.attr("data-contract"),
				thisid = thisoption.attr("data-id");
			if (thisvalue.length > 2 && currencysymbol === thisvalue || currency === thisvalue) {
				thisform.addClass("validated");
				var coin_data = {
					"cmcid": thisid,
					"currency": currency,
					"ccsymbol": currencysymbol,
					"contract": contract
				}
				thisinput.val(thistext)[0].setSelectionRange(0, 999);
				initaddressform(coin_data);
			} else if (currencysymbol.match("^" + thisvalue) || currency.match("^" + thisvalue)) {
				thisoption.addClass("show");
			}
		});
	})
}

function pickerc20select() {
	$(document).on("click touch", "#erc20formbox .selectbox > #ac_options span", function() {
		var thisselect = $(this),
			coin_data = {
				"cmcid": thisselect.attr("data-id"),
				"currency": thisselect.attr("data-currency"),
				"ccsymbol": thisselect.attr("data-ccsymbol"),
				"contract": thisselect.attr("data-contract")
			};
		initaddressform(coin_data);
	})
}

function initaddressform(coin_data) {
	var erc20formbox = $("#erc20formbox"),
		erc20_inputs = erc20formbox.find("#erc20_inputs"),
		addressfield = erc20formbox.find("input.address"),
		labelfield = erc20formbox.find("input.addresslabel");
	addressfield.add(labelfield).val("");
	erc20formbox.data(coin_data);
	addressfield.attr("placeholder", "Enter a " + coin_data.currency + " address");
	if (erc20_inputs.is(":visible")) {
	}
	else {
		erc20_inputs.slideDown(300);
		addressfield.focus();
	}
}

function submit_erc20() {
	$(document).on("click touch", "#erc20formbox input.submit", function(e) {
		e.preventDefault();
		validateaddress($(this).closest("#erc20formbox"));
	});
}

function validateaddress(thisnode) {
	var this_data = thisnode.data(),
		iserc20 = (this_data.erc20 === true),
		currency = this_data.currency,
		currencycheck = (iserc20 === true) ? "ethereum" : currency,
		ccsymbol = this_data.ccsymbol,
		addressfield = thisnode.find(".address"),
		addressinputval = addressfield.val(),
		currentaddresslist = $("main #" + currency + " .content ul.pobox[data-currency='" + currency + "']"),
		getindex = currentaddresslist.children("li").length + 1,
		index = (getindex > 1) ? getindex : "new",
		labelfield = thisnode.find(".addresslabel"),
		labelinput = labelfield.val(),
		labelinputval = (labelinput) ? labelinput : ccsymbol + index;
	if (currency) {
		if (addressinputval) {
			var addressduplicate = currentaddresslist.children("li[data-address=" + addressinputval + "]").length > 0,
				address = this_data.address,
				label = this_data.label;
			if (addressduplicate === true && address !== addressinputval) {
				popnotify("error", "address already exists");
				addressfield.select();
			} else {
				var valid = check_address(addressinputval, currencycheck);
				if (valid === true) {
					var validlabel = check_address(labelinputval, currencycheck);
					if (validlabel === true) {
						popnotify("error", "invalid label");
						labelfield.val(label).select();
					} else {
						if ($("#addressformbox").hasClass("formedit")) {
							var currentlistitem = currentaddresslist.children("li[data-address='" + address + "']");
							currentlistitem.data({"label": labelinputval, "address": addressinputval}).attr("data-address", addressinputval);
							currentlistitem.find(".atext h2 > span").text(labelinputval);
							currentlistitem.find(".atext p.address").text(addressinputval);
							saveaddresses(currency);
							canceldialog();
							canceloptions();
						} else {
							var pk_checkbox = thisnode.find("#pk_confirmwrap"),
								pk_checked = pk_checkbox.data("checked");
							if (pk_checked == true) {
								if (index == "new") {
									if (iserc20 === true) {
										buildpage(this_data, true);
										append_coinsetting(currency, erc20_settings, false);
									}
									localStorage.setItem("bitrequest_active", '"yes"');
									if (body.hasClass("showstartpage")) {
										var acountname = $("#eninput").val();
										$("#accountsettings").data("selected", acountname).find("p").html(acountname);
										savesettings();
										var href = "?p=home&payment=" + currency + "&uoa=" + ccsymbol + "&amount=0" + "&address=" + addressinputval;
										localStorage.setItem("bitrequest_editurl", href); // to check if request is being edited
										openpage(href, "create " + currency + " request", "payment");
									} else {
										loadpage("?p=" + currency);
									}
									body.removeClass("showstartpage");
									$("#usedcurrencies > li[data-currency='" + currency + "']").attr("data-checked", "true").data("checked", true);
									$("#currencylist > li[data-currency='" + currency + "']").removeClass("hide");
									savecurrencies();
								}
								this_data.address = addressinputval,
								this_data.label = labelinputval,
								this_data.checked = true,
								appendaddress(currency, this_data);
								saveaddresses(currency);
								canceldialog();
								canceloptions();
							}
							else {
								popnotify("error", "Confirm privatekey ownership");
							}
						}
					}
				} else {
					var errormessage = addressinputval + " is NOT a valid " + currency + " address";
					popnotify("error", errormessage);
					setTimeout(function() {
						addressfield.select();
					}, 10);
				}
			}
		} else {
			var errormessage = "Enter a " + currency + " address";
			popnotify("error", errormessage);
			addressfield.focus();
		}
	}
	else {
		var errormessage = "Pick a currency";
			popnotify("error", errormessage);
	}
}

function check_address(address, currency) {
	var regex = getcoindata(currency).regex;
	return (currency == "ethereum" || regex == "web3") ? (web3) ? web3.utils.isAddress(address) : false :
		(regex) ? new RegExp(regex).test(address) : false;
}

function canceldialogtrigger() {
	$(document).on("click touchend", "#popup, #canceldialog", function(e) {
		if (e.target == this) {
			var options = $("#dialog").find(".options");
			if (options.length > 0 && options.hasClass("showoptions")) {
				options.removeClass("showoptions");
				return false;
			}
			else {
				canceldialog();
			}
		}
		
	});
}

function canceldialog(pass) {
	if (inframe === true) {
		if (pass === true) {
		}
		else {
			if ($("#contactformbox").length > 0) {
				return false;
			}
		}
	}
	var popup = $("#popup");
	body.removeClass("blurmain themepu");
	popup.removeClass("active");
	var timeout = setTimeout(function() {
		popup.removeClass("showpu");
		$("#dialogbody").html("");
		$(document).off("click touch", "#execute");
		// reset Globals
		s_id = undefined;
		is_erc20t = undefined;
	}, 600, function() {
		clearTimeout(timeout);
	});
}

function cancelpaymentdialogtrigger() {
	$(document).on("click", "#payment", function(e) {
		var timelapsed = $.now() - cp_timer;
		if (timelapsed < 1500) { // prevent clicking too fast
			playsound(funk);
			console.log("clicking too fast");
		}
		else {
			if (e.target == this) {
				escapeandback();
				cp_timer = $.now();
			}
		}
	});
}

function cancelpaymentdialog() {
	if (inframe === true) {
		return false;
	}
	paymentpopup.removeClass("active");
	html.removeClass("blurmain_payment");
	var timeout = setTimeout(function() {
		paymentpopup.removeClass("showpu outgoing");
		html.removeClass("paymode firstload");
		$(".showmain #mainwrap").css("-webkit-transform", "translate(0, 0)"); // restore fake scroll position
		$(".showmain").closest(document).scrollTop(scrollposition); // restore real scroll position
		remove_flip(); // reset request facing front
		paymentdialogbox.html(""); // remove html
		clearTimeout(timeout);
	}, 600);
	closesocket();
	clearpingtx("close");
	closenotify();
}

function closesocket() {
	clearInterval(ping);
	ping = null;
	if (websocket) {
		websocket.close();
		websocket = null;
	}
	txid = null;
}

function forceclosesocket() {
	clearInterval(ping);
	ping = null;
	if (websocket) {
		websocket.close();
		websocket.terminate();
		websocket.forEach((socket) => {
		  	// Soft close
		  	socket.close();
		  	socket.terminate();
		  	process.nextTick(() => {
		    	if ([socket.OPEN, socket.CLOSING].includes(socket.readyState)) {
					// Socket still hangs, hard close
					socket.terminate();
		    	}
		  	});
		});
		websocket = null;
	}
	txid = null;
	closesocket();
}

function clearpingtx(close) {
	clearInterval(pingtx);
	pingtx = null;
	if (close) {
		closechainstate();
	}
	else {
		chainstate("Connection stopped", "offline");
	}
}

function cancelsharedialogtrigger() {
	$(document).on("click touchend", "#sharepopup", function(e) {
		if (e.target == this) {
			cancelsharedialog();
		}
	});
}

function cancelsharedialog() {
	var sharepopup = $("#sharepopup");
	sharepopup.removeClass("active");
	body.removeClass("sharemode");
	var timeout = setTimeout(function() {
		sharepopup.removeClass("showpu");
	}, 500, function() {
		clearTimeout(timeout);
	});
}

function showoptionstrigger() {
	$(document).on("click touch", ".popoptions", function(e) {
		var ad = $(this).closest("li").data(),
			savedrequest = $("#requestlist li[data-address='" + ad.address + "']"),
			showrequests = (savedrequest.length > 0) ? "<li><a href='#' class='showrequests'><span class='icon-qrcode'></span> Show requests</a></li>" : "",
			content = $("\
				<ul id='optionslist''>\
					<li>\
						<a href='' class='newrequest' title='create request'>\
							<span class='icon-plus'></span> New request</a>\
					</li>"
					+ showrequests +
					"<li><a href='#' class='editaddress'> <span class='icon-pencil'></span> Edit address</a></li>\
					<li><a href='#' class='removeaddress'><span class='icon-bin'></span> Remove address</a></li>\
					<li><a href='#' class='showtransactions'><span class='icon-eye'></span> Show transactions</a></li>\
				</ul>").data(ad);
		showoptions(content);
		return false;
	});
}

function showoptions(content, addclass) {
	var plusclass = (addclass) ? " " + addclass : "";
	$("#optionspop").addClass("showpu active" + plusclass);
	$("#optionsbox").append(content);
	body.addClass("blurmain_options");
}

function newrequest_alias() {
	$(document).on("click touch", ".newrequest_alias", function() {
		var currencylist = $("#currencylist"),
			active_currencies = currencylist.find("li").not(".hide"),
			active_currency_count = active_currencies.length;
		if (active_currency_count === 0) {
			alert("no active currencies");
		}
		else {
			if (active_currency_count > 1) {
				content = "<ul id='alias_currencylist' class='currencylist'>" + currencylist.html() + "</ul>"
				showoptions(content);
			}
			else {
				var active_currency_trigger = active_currencies.find("a").first();
				triggertxfunction(active_currency_trigger);
			}
		}
		return false;
		
	});
}

function newrequest() {
	$(document).on("click touch", ".newrequest", function(e) {
		e.preventDefault();
		var thislink = $(this),
			ad = thislink.closest("#optionslist").data(),
			thishref = "?p=" + geturlparameters().p + "&payment=" + ad.currency + "&uoa=" + ad.ccsymbol + "&amount=0&address=" + ad.address,
			title = thislink.attr("title");
		localStorage.setItem("bitrequest_editurl", thishref); // to check if request is being edited
		canceloptions();
		remove_flip(); // reset request card facing front
		openpage(thishref, title, "payment");
	});
}

function showrequests() {
	$(document).on("click touch", ".showrequests", function(e) {
		e.preventDefault();
		loadpage("?p=requests&filteraddress=" + $(this).closest("ul").data("address"));
		canceloptions();
	});
}

function editaddresstrigger() {
	$(document).on("click touch", ".editaddress", function(e) {
		e.preventDefault();
		addaddress($(this).closest("ul").data(), true);
	})
}

function removeaddress() {
	$(document).on("click touch", ".removeaddress", function(e) {
		e.preventDefault();
		popdialog("<h2 class='icon-bin'>Remove address?</h2>", "alert", "removeaddressfunction", $(this));
	})
}

function removeaddressfunction(trigger) {
	var result = confirm("Are you sure?");
	if (result === true) {
		var optionslist = trigger.closest("ul#optionslist"),
			ad = optionslist.data(),
			currency = ad.currency,
			address = ad.address,
			erc20 = ad.erc20,
			currentaddresslist = $("main #" + currency + " .content ul.pobox[data-currency='" + currency + "']");
		currentaddresslist.children("li[data-address='" + address + "']").remove();
		if (currentaddresslist.children("li").length) {} else {
			loadpage("?p=currencies");
			var currencyli = $("#usedcurrencies > li[data-currency='" + currency + "']"),
				homeli = $("#currencylist > li[data-currency='" + currency + "']");
			if (erc20 === true) {
				$("#" + currency + ".page").remove();
				currencyli.remove();
				homeli.remove();
			}
			else {
				currencyli.data("checked", false).attr("data-checked", "false");
				homeli.addClass("hide");
			}
			savecurrencies();
		}
		canceldialog();
		canceloptions();
		notify("Address deleted 🗑");
		saveaddresses(currency);
	}
}

function showtransaction_trigger() {
	$(document).on("click touch", ".metalist .show_tx, .transactionlist .tx_val", function() {
		var thisnode = $(this),
			thislist = thisnode.closest("li"),
			rqli = thisnode.closest("li.rqli"),
			txhash = (thisnode.hasClass("tx_val")) ? thislist.data("txhash") : rqli.data("txhash"),
			currency = rqli.data("payment"),
			erc20 = rqli.data("erc20");
			blockchainurl = blockexplorer_url(currency, true, erc20);
		if (blockchainurl === undefined || txhash === undefined) {	
		}
		else {
			open_blockexplorer_url(blockchainurl + txhash);
		}
	})
}

function showtransactions() {
	$(document).on("click touch", ".showtransactions", function(e) {
		e.preventDefault();
		var ad = $(this).closest("ul").data(),
			blockchainurl = blockexplorer_url(ad.currency, false, ad.erc20);
		if (blockchainurl === undefined) {	
		}
		else {
			open_blockexplorer_url(blockchainurl + ad.address);
		}
	})
}

function open_blockexplorer_url(be_link) {
	var result = confirm("Open " + be_link + "?");
	if (result === true) {
		window.location.href = be_link;
	}
}

function blockexplorer_url(currency, tx, erc20) {
	if (erc20 == "true" || erc20 === true) {
		var tx_prefix = (tx === true) ? "tx/" : "address/";
		return "https://ethplorer.io/" + tx_prefix;
	}
	else {
		var be_settings_li = $("#" + currency + "_settings .cc_settinglist li[data-id='blockexplorers']"),
			blockexplorer = be_settings_li.data("selected");
		if (blockexplorer) {
			var blockdata = $.grep(blockexplorers, function(filter) { //filter pending requests	
				return filter.name == blockexplorer;
			})[0],
				be_prefix = blockdata.prefix,
				coindata = getcoindata(currency),
				prefix = (be_prefix == "currencysymbol") ? coindata.ccsymbol : (be_prefix == "currency") ? currency : be_prefix,
				prefix_type = (tx === true) ? blockdata.tx_prefix : blockdata.address_prefix;
			return blockdata.url + prefix + "/" + prefix_type;
		}
	}
}

function apisrc_shortcut() {
	$(document).on("click touch", ".api_source", function() {
		var rpc_settings_li = $("#" + $(this).closest("li.rqli").data("payment") + "_settings .cc_settinglist li[data-id='apis']");
		if (rpc_settings_li.length > 0) {
			rpc_settings_li.trigger("click");
		}
	})
}

function canceloptionstrigger() {
	$(document).on("click touch", "#optionspop, #closeoptions", function(e) {
		if (e.target == this) {
			canceloptions();
		}
	});
}

function canceloptions() {
	var optionspop = $("#optionspop");
	optionspop.addClass("fadebg");
	optionspop.removeClass("active");
	body.removeClass("blurmain_options");
	var timeout = setTimeout(function() {
		optionspop.removeClass("showpu pin fadebg");
		$("#optionsbox").html("");
	}, 600, function() {
		clearTimeout(timeout);
	});
}

// ** Requestlist functions **

function showrequestdetails() {
	$(document).on("click touch", ".requestlist .liwrap", function() {
		var thisnode = $(this),
			thislist = thisnode.closest("li"),
			infopanel = thisnode.next(".moreinfo"),
			metalist = infopanel.find(".metalist");
		if (infopanel.is(":visible")) {
			infopanel.add(metalist).slideUp(200);
			thislist.removeClass("visible_request");
		} else {
			var fixednavheight = $("#fixednav").height();
			$(".requestlist > li").not(thislist).removeClass("visible_request");
			$(".moreinfo").add(".metalist").not(infopanel).slideUp(200);
			setTimeout(function() {
				$("html, body").animate({
					scrollTop: thislist.offset().top - fixednavheight
				}, 200);
				infopanel.slideDown(200);
				thislist.addClass("visible_request");
				var confbar = thislist.find(".transactionlist .confbar");
				if (confbar.length > 0) {
					confbar.each(function(i) {
						animate_confbar($(this), i);
					});
				}
			}, 220);
		}
		thislist.find(".transactionlist .historic_meta").slideUp(200);
	});
}

function toggle_request_meta() {
	$(document).on("click touch", ".requestlist li .req_actions .icon-info", function() {
		var metalist = $(this).closest(".moreinfo").find(".metalist");
		if (metalist.is(":visible")) {
			metalist.slideUp(300);
			//confbar.css("transform", "translate(-100%)");
		} else {
			var confbar = metalist.find(".confbar");
			metalist.slideDown(300);
			if (confbar.length > 0) {
				confbar.each(function(i) {
					animate_confbar($(this), i);
				});
			}
		}
		return false;
	})
}

function show_transaction_meta() {
	$(document).on("dblclick", ".requestlist li .transactionlist li", function() {
		var thisli = $(this),
			txmeta = thisli.children(".historic_meta");
		if (txmeta.is(":visible")) {
		} else {
			var txlist = thisli.closest(".transactionlist"),
				alltxmeta = txlist.find(".historic_meta");
			alltxmeta.not(txmeta).slideUp(300);
			txmeta.slideDown(300);
		}
		return false;
	})
}

function hide_transaction_meta() {
	$(document).on("click touch", ".requestlist li .transactionlist li", function() {
		var thisli = $(this),
			tx_meta = thisli.children(".historic_meta");
		if (tx_meta.is(":visible")) {
			tx_meta.slideUp(300);
		}
		return false;
	})
}

function animate_confbar(confbox, index) {
	confbox.css("transform", "translate(-100%)");
	var txdata = confbox.closest("li").data(),
		percentage = (txdata.confirmations / txdata.setconfirmations) * 100,
		percent_output = (percentage > 100) ? 100 : percentage,
		percent_final = (percent_output - 100).toFixed(2);
	setTimeout(function() {
		confbox.css("transform", "translate(" + percent_final + "%)");
	}, index * 500);
}

function archive() {
	$(document).on("click touch", "#requestlist .req_actions .icon-folder-open", function() {
		popdialog("<h2 class='icon-folder-open'>Archive request?</h2>", "alert", "archivefunction", $(this));
		return false;
	})
}

function archivefunction() {
	var thisreguest = $("#requestlist > li.visible_request")
		requestdata = thisreguest.data(),
		requestcopy = thisreguest.clone();
	if (thisreguest.data("status") == "insufficient") {
		updaterequest({
			"requestid": requestdata.requestid,
			"status": "archive_pending"
		});
	}
	thisreguest.slideUp(300);
	requestcopy.data(requestdata).prependTo($("#archivelist"));
	setTimeout(function() {
		thisreguest.remove();
		savearchive();
		saverequests();
	}, 350);
	var viewarchive = $("#viewarchive"),
		va_title = viewarchive.attr("data-title"),
		archivecount = $("#archivelist > li").length;
	viewarchive.slideDown(300).text(va_title + " (" + archivecount + ")");
	canceldialog();
	notify("Moved to archive");
}

function unarchive() {
	$(document).on("click touch", "#archivelist .req_actions .icon-undo2", function() {
		popdialog("<h2 class='icon-undo2'>Unarchive request?</h2>", "alert", "unarchivefunction", $(this));
		return false;
	})
}

function unarchivefunction() {
	var thisreguest = $("#archivelist li.visible_request"),
		requestdata = thisreguest.data(),
		requestcopy = thisreguest.clone();
	thisreguest.slideUp(300);
	requestcopy.data(requestdata).prependTo($("#requestlist"));
	setTimeout(function() {
		thisreguest.remove();
		savearchive();
		saverequests();
		var viewarchive = $("#viewarchive"),
			va_title = viewarchive.attr("data-title"),
			archivecount = $("#archivelist > li").length;
		viewarchive.text(va_title + " (" + archivecount + ")");
		if (archivecount < 1) {
			viewarchive.slideUp(300);
		}
	}, 350);
	canceldialog();
	notify("Request restored");
}

function removerequest() {
	$(document).on("click touch", ".req_actions .icon-bin", function() {
		popdialog("<h2 class='icon-bin'>Delete request?</h2>", "alert", "removerequestfunction", $(this));
		return false;
	})
}

function removerequestfunction() {
	var result = confirm("Are you sure?");
	if (result === true) {
		var visiblerequest = $(".requestlist > li.visible_request");
		visiblerequest.slideUp(300);
		setTimeout(function() {
			visiblerequest.remove();
			saverequests();
			savearchive();
		}, 350);
		canceldialog();
		notify("Request deleted 🗑");
	}
}

// ** Helpers **

function get_amberdata_apikey() {
	var savedkey = $("#apikeys").data("amberdata"),
		keyselect = (savedkey) ? savedkey : to.ad_id;
	return "?x-api-key=" + keyselect;
}

function get_infura_apikey(rpcurl) {
	var savedkey = $("#apikeys").data("infura");
	return (/^[A-Za-z0-9]+$/.test(rpcurl.slice(rpcurl.length - 15))) ? "" : // check if rpcurl already contains apikey
		(savedkey) ? savedkey : to.if_id;
}

function api_proxy(ad) { // callback function from bitrequest.js
	var custom_url = ad.api_url,
		aud = (custom_url) ? {} :
		get_api_url({
			"api": ad.api,
			"search": ad.search
		}),
		params = ad.params,
		proxy = ad.proxy,
		api_url = (custom_url) ? custom_url : aud.api_url,
		key_param = aud.key_param,
		api_key = aud.api_key,
		set_key = (api_key) ? true : false,
		nokey = (key_param == "post") ? false : (!key_param) ? true : false,
		key_pass = (nokey === true || set_key === true);
	if (proxy === false || (phpsupportglobal === false && key_pass === true && proxy !== true)) {
		params.url = api_url;
		var bearer = ad.bearer;
		if (bearer && bearer === true) {
			params.headers = {
	        	"Authorization": "Bearer " + api_key
	    	};
		}
		return $.ajax(params);
	}
	else { // use api proxy
		var api_location = "api/",
			localhost = ad.localhost,
			app_root = (localhost === false) ? approot :
				(localhost === true || (phpsupportglobal === true && key_pass === true)) ? "" :
				approot,
			proxy_data = {
				"method": "POST",
				"cache": false,
				"timeout": 5000,
				"url": app_root + api_location,
				"data": $.extend(ad, aud, {
					"nokey": nokey
				})
			};
		return $.ajax(proxy_data);
	}
}

function result(e) {
	var result = e.br_result;
	return (result) ? result : e;
}

function get_api_url(get) {
	var api = get.api,
		search = get.search,
		ad = get_api_data(api),
		base_url = ad.base_url,
		key_param = ad.key_param,
		saved_key = $("#apikeys").data(api),
		ampersand = (search.indexOf("?") > -1 || search.indexOf("&") > -1) ? "&" : "?",
		api_param = (key_param && key_param != "bearer" && saved_key) ? ampersand + key_param + saved_key : "";
	return {
		"api_url": base_url + search + api_param,
		"api_key": saved_key,
		"ampersand": ampersand,
		"key_param": key_param
	}
}

function fetchsymbol(currencyname) {
	var ccsymbol = {};
	$.each(JSON.parse(localStorage.getItem("bitrequest_erc20tokens")), function(key, value) {
		if (value.name == currencyname) {
			return ccsymbol = {
				symbol: value.symbol,
				id: value.cmcid
			};
		}
	});
	return ccsymbol;
}

Number.prototype.toFixedSpecial = function(n) { //Convert from Scientific Notation to Standard Notation
    var str = this.toFixed(n);
    if (str.indexOf("e+") < 0) {
	     return str;
    }
    else {
	    // if number is in scientific notation, pick (b)ase and (p)ower
		var convert = str.replace(".", "").split("e+").reduce(function(p, b) {
	        return p + Array(b - p.length + 2).join(0);
	    }) + "." + Array(n + 1).join(0);
	    return convert.slice(0, -1);
    }
};

function fixedcheck(livetop) {
	var headerheight = $(".showmain #header").outerHeight();
	if (livetop > headerheight) {
		$(".showmain").addClass("fixednav");
	} else {
		$(".showmain").removeClass("fixednav");
	}
}

function geturlparameters() {
	var qstring = window.location.search.substring(1),
		getvalues = qstring.split("&"),
		get_object = {};
	$.each(getvalues, function(i, val) {
		var keyval = val.split("=");
		get_object[keyval[0]] = keyval[1];
	});
	return get_object;
}

function markedit() {
	body.addClass("edited")
}

function triggersubmit(trigger) {
	trigger.parent("#actions").prev("#dialogbody").find("input.submit").trigger("click");
}

function copytoclipboard(content, type) {
	var copyinputfield = $("#copyinput");
	copyinputfield.val(content);
	copyinputfield[0].setSelectionRange(0, 999);
	try {  
    	var success = document.execCommand("copy");
    	if (success) {
	    	notify(type + " copied to clipboard", 2500, "no");
    	}
		else {
			notify("Unable to copy " + type, 2500, "no");
		}  
	} catch(err) {  
	    notify("Unable to copy " + type, 2500, "no"); 
	}
	copyinputfield.val("").blur();
}

function getrandomnumber(min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}

function hashcode(str) {
	if (str) {
		return Math.abs(str.split("").reduce(function(a, b) {
			a = ((a << 5) - a) + b.charCodeAt(0);
			return a & a
		}, 0));
	}
	else {
		return false;
	}
}

function loader(top) {
	var loader = $("#loader"),
		class_string = (top === true) ? "showpu active toploader" : "showpu active";
	$("#loader").addClass(class_string);
}

function closeloader_trigger() {
	$(document).on("click touch", "#loader", function() {
		closeloader();
	})
}

function closeloader() {
	$("#loader").removeClass("showpu active toploader");
	loadertext("loading");
}

function loadertext(text) {
	$("#loader #loadtext > span").text(text);
}

function chainstate(text, symbol) {
	var csclass = (symbol) ? symbol : "",
		chainstatus = $("#chainstatus");
	chainstatus.attr("class", csclass).children("span").text(text);
	chainstatus.fadeIn(500)
}

function closechainstate() {
	chainstate("Closing conection");
	setTimeout(function() {
		$("#chainstatus").fadeOut(500)
	}, 3000);
}

function settitle(title) {
	titlenode.text(title);
	ogtitle.attr("content", title);
}

function getcc_icon(cmcid, cpid, erc20) {
	var icon_boolean = sessionStorage.getItem("bitrequest_icon_boolean"),
    	img_url = (erc20 === true) ? (offline === true) ? "img/qrplaceholder.png" :
    		(icon_boolean == "true" || icon_boolean === true) ? "https://s2.coinmarketcap.com/static/img/coins/200x200/" + cmcid + ".png" :
    		"https://static2.coinpaprika.com/coin/" + cpid + "/logo.png" :
			"img/logos/" + cpid + ".png";
	return "<img src='" + img_url + "' class='cmc_icon'/>";
}

function getdevicetype() {
	var ua = userAgent;
	return (is_android_app === true) ? "android-app" :
	(is_ios_app === true) ? "apple-app" :
		(/iPad/.test(ua)) ? "iPad" :
		(/iPhone/.test(ua)) ? "iPhone" :
		(/Android/.test(ua)) ? "Android" :
		(/Macintosh/.test(ua)) ? "Macintosh" :
		(/Windows/.test(ua)) ? "Windows" :
		"unknown";
};

function makedatestring(datetimeparts) {
	var split = (datetimeparts.indexOf(".") > -1) ? "." : "Z";
	return datetimeparts[0] + " " + datetimeparts[1].split(split)[0];
}

function returntimestamp(datestring) {
	var datetimeparts = datestring.split(" "),
		timeparts = datetimeparts[1].split(":"),
		dateparts = datetimeparts[0].split("-");
	return new Date(dateparts[0], parseInt(dateparts[1], 10) - 1, dateparts[2], timeparts[0], timeparts[1], timeparts[2]);
}

function weekdays(day) {
	return {
		"0": "Sunday",
		"1": "Monday",
		"2": "Tuesday",
		"3": "Wednesday",
		"4": "Thursday",
		"5": "Friday",
		"6": "Saturday",
	};
}

function fulldateformat(date, language) {
	return weekdays()[date.getDay()] + " " + date.toLocaleString(language, {
		"month": "long"
	}) + " " + date.getUTCDate() + " | " + formattime(date);
}

function fulldateformatmarkup(date, language) {
	return weekdays()[date.getDay()] + " " + date.toLocaleString(language, {
		"month": "long"
	}) + " " + date.getUTCDate() + " | <div class='fdtime'>" + formattime(date) + "</div>";
}

function formattime(date) {
	var h = date.getHours(),
		m = date.getMinutes(),
		s = date.getSeconds(),
		hours = (h < 10) ? "0" + h : h,
		minutes = (m < 10) ? "0" + m : m,
		seconds = (s < 10) ? "0" + s : s;
	return " " + hours + ":" + minutes + ":" + seconds;
}

function playsound(audio) {
	var promise = audio[0].play();
	if (promise) {
		promise.then(_ => {
			// Autoplay started!
		}).catch(error => {
			// Fallback
		});
	}
}

function vibrate() {
	if (navigator.vibrate) {
		navigator.vibrate(100);
	}
}

function get_api_data(api_id) {
	var apipath = apis.filter(function(val) {
		return val.name == api_id;
	});
	return apipath[0];
}

function pinpanel(pinclass) {
	var makeclass = (pinclass === undefined) ? "" : pinclass;
	return "\
		<div id='pinfloat' class='enterpin" + makeclass + "'>\
			<p id='pintext'>Please enter your pin</p>\
			<p id='confirmpin'>Confirm new pin</p>\
			<input id='pininput' type='password' readonly='readonly'/>\
			<input id='validatepin' type='password' readonly='readonly'/>\
			<div id='pinkeypad'>\
				<div id='pin1' class='pinpad flex'>\
					<span class='pincell'>1</span>\
				</div>\
				<div id='pin2' class='pinpad'>\
					<span class='pincell'>2</span>\
				</div>\
				<div id='pin3' class='pinpad'>\
					<span class='pincell'>3</span>\
				</div><br>\
				<div id='pin4' class='pinpad'>\
					<span class='pincell'>4</span>\
				</div>\
				<div id='pin5' class='pinpad'>\
					<span class='pincell'>5</span>\
				</div>\
				<div id='pin6' class='pinpad'>\
					<span class='pincell'>6</span>\
				</div><br>\
				<div id='pin7' class='pinpad'>\
					<span class='pincell'>7</span>\
				</div>\
				<div id='pin8' class='pinpad'>\
					<span class='pincell'>8</span>\
				</div>\
				<div id='pin9' class='pinpad'>\
					<span class='pincell'>9</span>\
				</div><br>\
				<div id='locktime' class='pinpad'>\
					<span class='icomoon'></span>\
				</div>\
				<div id='pin0' class='pinpad'>\
					<span class='pincell'>0</span>\
				</div>\
				<div id='pinback' class='pinpad'>\
					<span class='icomoon'></span>\
				</div>\
			</div>\
		</div>";
}

function switchpanel(switchmode, mode) {
	return "<div class='switchpanel " + switchmode + mode + "'><div class='switch'></div></div>"
}

function getcoindata(currency) {
	var coindata_object = bitrequest_coin_data.filter(function(val) {
    	return val.currency == currency;
	});
	if (coindata_object.length > 0) {
		var coindata = coindata_object[0].data,
			settings = coindata_object[0].settings,
			has_settings = (settings) ? true : false,
			is_monitored = (settings) ? (settings.apis) ? true : false : false,
			cd_object = {
				"currency": coindata.currency,
				"ccsymbol": coindata.ccsymbol,
				"cmcid": coindata.cmcid,
				"monitored": is_monitored,
				"urlscheme": coindata.urlscheme,
				"settings": has_settings,
				"regex": coindata.address_regex,
				"erc20": false
			};
		return cd_object;
	}
	else { // if not it's probably erc20 token
		var currencyref = $("#usedcurrencies li[data-currency='" + currency + "']"); // check if erc20 token is added
		if (currencyref.length > 0) {
			return currencyref.data();
		}
		else { // else lookup erc20 data
			var tokenobject = JSON.parse(localStorage.getItem("bitrequest_erc20tokens"));
			if (tokenobject) {
				var erc20data = $.grep(tokenobject, function(filter) { //filter pending requests	
					return filter.name == currency;
				})[0];
				if (erc20data) {
					return {
						"currency": erc20data.name,
						"ccsymbol": erc20data.symbol,
						"cmcid": erc20data.cmcid.toString(),
						"contract": erc20data.contract,
						"monitored": true,
						"url-scheme": "",
						"regex": "web3",
						"erc20": true
					}
				}
				else {
					return false;
				}
			}
			else {
				return false;
			}
		}
	}
}

function getcoinsettings(currency) {
	var coindata = $.grep(bitrequest_coin_data, function(filter) { //filter pending requests	
		return filter.currency == currency;
	})[0];
	if (coindata) {
		return coindata.settings;
	}
	else { // return erc20 settings
		return erc20_settings;
	}
}

function try_next_api(apilistitem, current_apiname) {
	var apilist = apilists[apilistitem],
		next_scan = apilist[$.inArray(current_apiname, apilist) + 1],
		next_api = (next_scan) ? next_scan : apilist[0];
	if (api_attempt[apilistitem][next_api] === true) {
		return false;
	}
	else {
		return next_api;
	}
}

// Fix decimals
function trimdecimals(amount, decimals) {
	var round_amount = parseFloat(amount).toFixed(decimals);
	return parseFloat(round_amount.toString());
}

// ** Page rendering **

//render page from cache
function rendercurrencies() {
	initiate();
	var currencies = localStorage.getItem("bitrequest_currencies");
	if (currencies) {
		$.each(JSON.parse(currencies), function(index, data) {
			var thiscurrency = data.currency,
				thiscmcid = data.cmcid;
			buildpage(data, false);
			render_currencysettings(thiscurrency);
			var addresses = localStorage.getItem("bitrequest_cc_" + thiscurrency);
			if (addresses) {
				$.each(JSON.parse(addresses).reverse(), function(index, address_data) {
					appendaddress(thiscurrency, address_data);
				});
			}
		});
	}
	$("ul#allcurrencies").append("<li id='choose_erc20' data-currency='erc20 token' class='start_cli' data-currency='erc20 token'><div class='liwrap'><h2><img src='img/erc20.png'/>erc20 token</h2></div></li>\
	<li id='rshome' class='restore start_cli' data-currency='erc20 token'><div class='liwrap'><h2><span class='icon-upload'> Restore from backup</h2></div></li><li id='start_cli_margin' class='start_cli'><div class='liwrap'><h2></h2></div></li>");
}

// render currency settings
function render_currencysettings(thiscurrency) {
	var settingcache = localStorage.getItem("bitrequest_" + thiscurrency + "_settings");
	if (settingcache) {
		append_coinsetting(thiscurrency, JSON.parse(settingcache), false)
	}
}

// build settings
function buildsettings() {
	var appsettingslist = $("#appsettings");
	$.each(app_settings, function(i, value) {
		var setting_li = $("<li class='render' id='" + value.id + "'>\
		  	<div class='liwrap iconright'>\
		     	<span class='" + value.icon + "'></span>\
		         <div class='atext'>\
		            <h2>" + value.heading + "</h2>\
		            <p>" + value.selected + "</p>\
		         </div>\
		         <div class='iconbox'>\
				 	<span class='icon-pencil'></span>\
				</div>\
		  	</div>\
		</li>");
		setting_li.data(value).appendTo(appsettingslist);
	});
}

// add serviceworker
function add_serviceworker() {
	if ("serviceWorker" in navigator) {
		if (navigator.serviceWorker.controller) {
	    	console.log("active service worker found, no need to register");
	  	} else {
	    	// Register the service worker
			navigator.serviceWorker.register("../serviceworker.js", {
				scope: "./"
	      	})
		  	.then(function (reg) {
	        	console.log("Service worker has been registered for scope: " + reg.scope);
	      	});
	  	}
	} else {
		console.log("service worker is not supported");
	}
}

// render settings
function rendersettings(excludes) {
	var settingcache = localStorage.getItem("bitrequest_settings");
	if (settingcache) {
		$.each(JSON.parse(settingcache), function(i, value) {
			if ($.inArray(value.id, excludes) === -1) { // exclude excludes
				$("#" + value.id).data(value).find("p").html(value.selected);
			}
		});
	}
}

function renderrequests() {
	fetchrequests("bitrequest_requests", false);
	fetchrequests("bitrequest_archive", true);
	var archivecount = $("#archivelist > li").length;
	if (archivecount > 0) {
		var viewarchive = $("#viewarchive"),
			va_title = viewarchive.attr("data-title");
		viewarchive.show().text(va_title + " (" + archivecount + ")");
	}
}

function fetchrequests(cachename, archive) {
	var requestcache = localStorage.getItem(cachename);
	if (requestcache) {
		var parsevalue = JSON.parse(requestcache),
			showarchive = (archive === false && parsevalue.length > 6); // only show archive button when there are more then 6 requests
		$.each(parsevalue.reverse(), function(i, value) {
			value.archive = archive;
			value.showarchive = showarchive;
			appendrequest(value);
		});
	}
}

//initiate page when there's no cache
function initiate() {
	$.each(bitrequest_coin_data, function(dat, val) {
		var settings = val.settings,
			has_settings = (settings) ? true : false,
			is_monitored = (settings) ? (settings.apis) ? true : false : false,
			cd = val.data,
			coindata = {
				"currency": cd.currency,
				"ccsymbol": cd.ccsymbol,
				"checked": false,
				"cmcid": cd.cmcid,
				"erc20": false,
				"monitored": is_monitored,
				"settings": has_settings,
				"urlscheme": cd.urlscheme
			};
		buildpage(coindata, true);
		append_coinsetting(val.currency, settings, true);
	});
}

function buildpage(cd, init) {
	var currency = cd.currency,
		ccsymbol = cd.ccsymbol,
		checked = cd.checked,
		cmcid = cd.cmcid,
		cpid = ccsymbol + "-" + currency;
		erc20 = cd.erc20,
	// append currencies
		currencylist = $("ul#usedcurrencies"),
		cc_li = currencylist.children("li[data-currency='" + currency + "']"),
		home_currencylist = $("ul#currencylist"),
		home_cc_li = home_currencylist.children("li[data-currency='" + currency + "']"),
		visibility = (checked === true) ? "" : "hide",
		has_settings = (cd.settings === true || erc20 === true),
		init = (cc_li.length === 0 && init === true);
	if (init === true || erc20 === true) {
		var new_li = $("<li class='iconright' data-currency='" + currency + "' data-checked='" + checked + "'>\
			<a href='?p=" + currency + "' class='liwrap addcurrency'>\
				<h2>" + getcc_icon(cmcid, cpid, erc20) + " " + currency + "\</h2>\
			</a>\
			<div class='iconbox togglecurrency'>\
				<span class='checkbox'></span>\
			</div>\
		</li>");
		new_li.data(cd).appendTo(currencylist);
		// append currencies homepage
		var new_homeli = $("<li class='" + visibility + "' data-currency='" + currency + "'>\
			<a href='?p=home&payment=" + currency + "&uoa=' data-title='create " + currency + " request' data-currency='" + currency + "'>"
				+ getcc_icon(cmcid, cpid, erc20) + "\
			</a>\
		</li>");
		new_homeli.data(cd).appendTo(home_currencylist);
		var settingspage = (has_settings === true) ? "\
		<div class='page' id='" + currency + "_settings' data-erc20='" + erc20 + "'>\
			<div class='content'>\
				<h2 class='heading'>" + currency + " settings</h2>\
				<ul class='cc_settinglist settinglist applist listyle2'></ul>\
				<div class='reset_cc_settings button' data-currency='" + currency + "'>\
					<span>Reset</span>\
				</div>\
			</div>\
		</div>" : "";
		var settingsbutton = (has_settings === true) ? "<a href='?p=" + currency + "_settings' class='self icon-cog'></a>" : "";
		var currency_page = $("<div class='page' id='" + currency + "'>\
			<div class='content'>\
				<h2 class='heading'>" + currency + settingsbutton + "</h2>\
				<ul class='applist listyle2 pobox' data-currency='" + currency + "'>\
					<div class='endli'><div class='button addaddress' data-currency='" + currency + "'><span class='icon-plus'>Add address</span></div></div>\
				</ul>\
			</div>\
		</div>"
		+ settingspage);
		currency_page.data(cd).appendTo("main");
		if (erc20 === true) {
			var coin_settings_cache = localStorage.getItem("bitrequest_" + currency + "_settings");
			if (coin_settings_cache === null) {
				localStorage.setItem("bitrequest_" + currency + "_settings", JSON.stringify(erc20_settings));
			}
		}
	}
	else {
		cc_li.data(cd).attr("data-checked", checked);
		home_cc_li.data(cd).removeClass("hide").addClass(visibility);
	}
	$("ul#allcurrencies").append("<li class='start_cli choose_currency' data-currency='" + currency + "' data-checked='" + checked + "'>\
		<a href='?p=" + currency + "' class='liwrap'>\
			<h2>" + getcc_icon(cmcid, cpid, erc20) + " " + currency + "\</h2>\
		</a>\
	</li>");
}

function append_coinsetting(currency, settings, init) {
	var coinsettings_list = $("#" + currency + "_settings ul.cc_settinglist");
	$.each(settings, function(dat, val) {
		var selected = val.selected,
			selected_val = (selected.name) ? selected.name : (selected.url) ? selected.url : selected;
		if (selected_val !== undefined) {
			var selected_string = selected_val.toString(),
				check_setting_li = coinsettings_list.children("li[data-id='" + dat + "']");
			if (check_setting_li.length === 0) {
				var trigger = (dat == "showsatoshis") ? switchpanel(selected_string, " global") : "<span class='icon-pencil'></span>";
				var coinsettings_li = $("<li data-id='" + dat + "'>\
					<div class='liwrap edit_trigger iconright' data-currency='" + currency + "'>\
						<span class='icon-" + val.icon + "'></span>\
						<div class='atext'>\
							<h2>" + dat + "</h2>\
							<p>" + selected_string + "</p>\
						</div>\
						<div class='iconbox'>" + trigger + "</div>\
						</div>\
				</li>");
				coinsettings_li.data(val).appendTo(coinsettings_list);
			}
			else {
				check_setting_li.data(val).find("p").html(selected_string);
				if (dat == "showsatoshis") {
					check_setting_li.find(".switchpanel").removeClass("true false").addClass(selected_string);
				}
			}
		}
	});
}

function appendaddress(currency, ad) {
	var address = ad.address,
		pobox = $("main #" + currency + " .content ul.pobox[data-currency='" + currency + "']"),
		index = pobox.children("li").length + 1,
		address_li = $("<li data-index='" + index + "' data-address='" + address + "' data-checked='" + ad.checked + "'>\
			<div class='addressinfo liwrap iconright2'>\
				<div class='atext'>\
					<h2>" + getcc_icon(ad.cmcid, ad.ccsymbol + "-" + currency, ad.erc20) + " <span>" + ad.label + "</span></h2>\
					<p class='address'>" + address + "</p>\
				</div>\
				<div class='iconbox'>\
					<span class='checkbox toggleaddress'></span>\
					<span class='popoptions icon-menu2'></span>\
				</div>\
			</div>\
		</li>");
	address_li.data(ad).prependTo(pobox);
}

function appendrequest(rd) {
	var payment = rd.payment, erc20 = rd.erc20, uoa = rd.uoa, amount = rd.amount, address = rd.address, currencysymbol = rd.currencysymbol, cmcid = rd.cmcid, cpid = rd.cpid, requesttype = rd.requesttype, iscrypto = rd.iscrypto, requestname = rd.requestname, requesttitle = rd.requesttitle, set_confirmations = rd.set_confirmations, currencyname = rd.currencyname, receivedamount = rd.receivedamount, fiatvalue = rd.fiatvalue, paymenttimestamp = rd.paymenttimestamp, txhash = rd.txhash, confirmations = rd.confirmations, status = rd.status, pending = rd.pending, requestid = rd.requestid, archive = rd.archive, showarchive = rd.showarchive, blacklist = rd.blacklist, timestamp = rd.timestamp, requestdate = rd.requestdate, rqdata = rd.rqdata, rqmeta = rd.rqmeta, ismonitored = rd.monitored, online_purchase = rd.online_purchase, source = rd.source, txhistory = rd.txhistory,
		uoa_upper = uoa.toUpperCase(),
		deter = (iscrypto === true) ? 5 : 2,
		insufficient = (status == "insufficient"),
		requesttitle_short = (requesttitle && requesttitle.length > 85) ? "<span title='" + requesttitle + "'>" + requesttitle.substring(0, 64) + "...</span>" : requesttitle,
		// Fix decimal rounding:
		amount_rounded = trimdecimals(amount, deter),
		receivedamount_rounded = trimdecimals(receivedamount, 5),
		fiatvalue_rounded = trimdecimals(fiatvalue, 2),
		requestlist = (archive === true) ? $("#archivelist") : $("#requestlist"),
		localtime = requestdate - timezone, // timezone correction
		incoming = (requesttype == "incoming"),
		outgoing = (requesttype == "outgoing"),
		local = (requesttype == "local"),
		direction = (incoming === true) ? "send" : "received",
		typetext = (incoming === true) ? (online_purchase === true) ? "online purchase" : "incoming" : (local === true) ? "point of sale" : "outgoing",
		requesticon = (incoming === true) ? (online_purchase === true) ? " typeicon icon-cart" : " typeicon icon-arrow-down-right2" : (local === true) ? " icon-qrcode" : " typeicon icon-arrow-up-right2",
		typeicon = "<span class='inout" + requesticon + "'></span> ",
		statusicon = "<span class='icon-checkmark' title='confirmed transaction'></span>\
			<span class='icon-clock' title='pending transaction'></span>\
			<span class='icon-eye-blocked' title='unmonitored transaction'></span>\
			<span class='icon-wifi-off' title='No network'></span>",
		requesttitlestring = (rqdata || requesttitle) ? (incoming === true) ? requestname : requesttitle_short : "<b>" + amount_rounded + "</b> " + currencyname + statusicon,
		requestnamestring = (rqdata || requesttitle) ? (incoming === true) ? "<strong>'" + requesttitle_short + "'</strong> (" + amount_rounded + " " + currencyname + ")" + statusicon : amount_rounded + " " + currencyname + statusicon : "",
		rqdataparam = (rqdata) ? "&d=" + rqdata : "",
		rqmetaparam = (rqmeta) ? "&m=" + rqmeta : "",
		requesttypeclass = "request" + requesttype,
		expirytime = (iscrypto === true) ? 25920000000 : 6048000000, // expirydate crypto: 300 days / fiat: 70 days
		isexpired = (($.now() - localtime) >= expirytime && (status == "new" || insufficient === true)),
		expiredclass = (isexpired === true) ? " expired" : "",
		ispendingclass = (isexpired === true) ? "expired" : pending,
		localtimeobject = new Date(localtime),
		requestdateformatted = fulldateformat(localtimeobject, "en-us"),
		timeformat = localtimeobject.toLocaleString('en-us', {
			month: 'short'
		}) + " " + localtimeobject.getUTCDate(),
		ptsformatted = fulldateformatmarkup(new Date(paymenttimestamp - timezone), "en-us"),
		amount_short_rounded = amountshort(amount, receivedamount, fiatvalue, iscrypto),
		amount_short_span = (insufficient === true) ? " (" + amount_short_rounded + " " + uoa_upper + " short)" : "",
		amount_short_cc_span = (iscrypto === true) ? amount_short_span : "",
		fiatvaluebox = (iscrypto === true) ? "" : "<li class='payday pd_fiat'><strong>Fiat value on<span class='pd_fiat'> " + ptsformatted + "</span> :</strong><span class='fiatvalue'> " + fiatvalue_rounded + "</span> " + currencyname + "<div class='show_as amountshort'>" + amount_short_span + "</div></li>",
		paymentdetails = "<li class='payday pd_paydate'><strong>Paid on:</strong><span class='paydate'> " + ptsformatted + "</span></li><li class='receivedamount'><strong>Amount " + direction + ":</strong><span> " + receivedamount_rounded + "</span> " + payment + "<div class='show_as amountshort'>" + amount_short_cc_span + "</div></li>" + fiatvaluebox,
		requestnamebox = (incoming === true) ? (rqdata) ? "<li><strong>From:</strong> " + requestname + "</li>" : "<li><strong>From: unknown</strong></li>" : "",
		requesttitlebox = (requesttitle) ? "<li><strong>Title:</strong> '<span class='requesttitlebox'>" + requesttitle + "</span>'</li>" : "",
		ismonitoredspan = (ismonitored === false) ? " (unmonitored transaction)" : "",
		timestampbox = (incoming === true) ? "<li><strong>Created:</strong> " + requestdateformatted + "</li><li><strong>First viewed:</strong> " + fulldateformat(new Date(timestamp - timezone), "en-us") + "</li>" :
			(outgoing === true) ? "<li><strong>Send on:</strong> " + requestdateformatted + "</li>" :
			(local === true) ? "<li><strong>Created:</strong> " + requestdateformatted + "</li>" : "",
		paymenturl = "&address=" + address + rqdataparam + rqmetaparam + "&requestid=" + requestid,
		islabel = $("main #" + payment + " li[data-address='" + address + "']").data("label"),
		requestlabel = (islabel) ? " <span class='requestlabel'>(" + islabel + ")</span>" : "",
		conf_box = (ismonitored === false) ? "<div class='txli_conf' data-conf='0'><span>Unmonitored transaction</span></div>" :
			(confirmations > 0) ? "<div class='txli_conf'><div class='confbar'></div><span>" + confirmations + " / " + set_confirmations + " confirmations</span></div>" :
			(confirmations === 0) ? "<div class='txli_conf' data-conf='0'><div class='confbar'></div><span>Unconfirmed transaction<span></div>" : "",	
		view_tx = (txhash) ? "<li><strong class='show_tx'><span class='icon-eye'></span>View on blockchain</strong></li>" : "",
		statustext = (ismonitored === false) ? "" : (status == "new") ? "Waiting for payment" : status,
		src_html = (source) ? "<span class='src_txt'>source: " + source + "</span><span class='icon-wifi-off'></span><span class='icon-connection'></span>" : "",
		iscryptoclass = (iscrypto === true) ? "" : " isfiat",
		archivebutton = (showarchive === true) ? "<div class='icon-folder-open' title='archive request'></div>" : "",
		render_archive = (txhistory && (pending == "no" || archive === true)),
		tl_text = (render_archive === true) ? (incoming === true) ? "Send transaction:" : "received transactions:" : "",
		edit_request = (local === true) ? "<div class='editrequest icon-pencil' title='edit request' data-requestid='" + requestid + "'></div>" : "",
		new_requestli = $("<li class='rqli " + requesttypeclass + expiredclass + "' id='" + requestid + "' data-cmcid='" + cmcid + "' data-status='" + status + "' data-address='" + address + "' data-pending='" + ispendingclass + "' data-iscrypto='" + iscrypto + "' data-blacklist='" + blacklist + "'>\
			<div class='liwrap iconright'>"
				+ getcc_icon(cmcid, cpid, erc20) + getcc_icon(cmcid, cpid, erc20)
				+ "<div class='atext'>\
					<h2>" + requesttitlestring + "</h2>\
					<p class='rq_subject'>" + typeicon + requestnamestring + "</p>\
				</div>\
				<p class='rq_date' title='" + requestdateformatted + "'>"+ timeformat + "</p><br/>\
				<div class='pmetastatus' data-count='0'>+ 0</div>\
				<div data-href='" + paymenturl + "' class='payrequest button" + iscryptoclass + "'>\
					<span class='icon-qrcode'>Pay</span>\
				</div>\
			</div>\
			<div class='moreinfo'>\
				<div class='req_actions'>\
					<div data-href='" + paymenturl + "' class='icon-qrcode" + iscryptoclass + "'></div>\
					<div class='icon-bin' title='delete'></div>"
						+ archivebutton +
					"<div class='icon-undo2' title='unarchive request'></div>\
					<div class='icon-info' title='show info'></div>" + edit_request + "</div>\
				<ul class='metalist'>\
					<li class='cnamemeta'><strong>Currency:</strong> " + payment + "</li>"
					+ requestnamebox
					+ requesttitlebox +
					"<li><strong>Amount:</strong> " + amount_rounded + " " + uoa_upper + "</li>\
					<li class='meta_status' data-conf='" + confirmations + "'><strong>Status:</strong><span class='status'> " + statustext + "</span> " + conf_box + "</li>\
					<li><strong>Type:</strong> " + typetext + ismonitoredspan + "</li>"
						+ timestampbox +
					"<li><p class='address'><strong>Address:</strong> <span class='requestaddress'>" + address + "</span>" + requestlabel + "</p></li>"
						+ paymentdetails
						+ view_tx + "\
				</ul>\
				<ul class='transactionlist'>\
					<h2>" + tl_text + "</h2>\
				</ul>\
				<div class='api_source'>" + src_html + "</div>\
			</div>\
			<div class='brstatuspanel flex'>\
				<img src='img/confirmed.png'>\
				<h2>Payment received</h2>\
			</div>\
			<div class='brmarker'></div>\
			<div class='expired_panel'><h2>Expired</h2></div>\
		</li>");
	new_requestli.data(rd).prependTo(requestlist);
	if (render_archive === true) {
		var transactionlist = requestlist.find("#" + requestid).find(".transactionlist");
		$.each(txhistory, function(dat, val) {
			var tx_listitem = append_tx_li(val, false);
			if (tx_listitem.length > 0) {
				transactionlist.append(tx_listitem.data(val));
			}
		});
	}
}

function amountshort(amount, receivedamount, fiatvalue, iscrypto) {
	var amount_recieved = (iscrypto === true) ? receivedamount : fiatvalue,
		amount_short = amount - amount_recieved;
	return (iscrypto === true) ? trimdecimals(amount_short, 5) : trimdecimals(amount_short, 2);
}

function editrequest() {
	$(document).on("click touch", ".editrequest", function() {
		var thisnode = $(this),
			thisrequestid = thisnode.attr("data-requestid"),
			requestlist = $("#" + thisrequestid),
			requesttitle = requestlist.data("requesttitle"),
			requesttitle_input = (requesttitle) ? requesttitle : "",
			formheader = (requesttitle) ? "Edit" : "Enter",
			content = "\
			<div class='formbox' id='edit_request_formbox'>\
				<h2 class='icon-pencil'>" + formheader + " description</h2>\
				<div class='popnotify'></div>\
				<div class='popform'>\
					<input type='text' value='" + requesttitle_input + "' placeholder='description'/>\
					<input type='submit' class='submit' value='OK' data-requestid='" + thisrequestid + "'/>\
				</div>\
			</div>";
		popdialog(content, "alert", "triggersubmit");
	})
}

function submit_request_description() {
	$(document).on("click touch", "#edit_request_formbox input.submit", function(e) {
		var thisnode = $(this),
			this_requestid = thisnode.attr("data-requestid"),
			this_requesttitle = thisnode.prev("input").val(),
			requesttitle_val = (this_requesttitle) ? this_requesttitle : "empty";
		updaterequest({
			"requestid": this_requestid,
			"requesttitle": requesttitle_val
		}, true);
		if (this_requesttitle) {
			canceldialog();
			notify("Request saved");
		}
		else {
			popnotify("error", "Description is a required field");
		}
	})
}

// ** Store data in localstorage **

//update used cryptocurrencies
function savecurrencies() {
	var currenciespush = [];
	$("#usedcurrencies li").each(function(i) {
		currenciespush.push($(this).data());
	});
	localStorage.setItem("bitrequest_currencies", JSON.stringify(currenciespush));
	updatechanges("currencies");
}

//update addresses in localstorage
function saveaddresses(currency) {
	var pobox = $("main #" + currency + " .content ul.pobox[data-currency='" + currency + "']"),
		addresses = pobox.find("li");
	if (addresses.length) {
		var addressboxpush = [];
		addresses.each(function(i) {
			addressboxpush.push($(this).data());
		});
		localStorage.setItem("bitrequest_cc_" + currency, JSON.stringify(addressboxpush));
	} else {
		localStorage.removeItem("bitrequest_cc_" + currency);
		localStorage.removeItem("bitrequest_" + currency + "_settings");
	}
	updatechanges("addresses");
}

//update requests
function saverequests() {
	var requestpush = [];
	$("ul#requestlist > li").each(function() {
		requestpush.push($(this).data());
	});
	localStorage.setItem("bitrequest_requests", JSON.stringify(requestpush));
	updatechanges("requests");
}

//update archive
function savearchive() {
	var requestpush = [];
	$("ul#archivelist > li").each(function() {
		requestpush.push($(this).data());
	});
	localStorage.setItem("bitrequest_archive", JSON.stringify(requestpush));
}

//update settings
function savesettings() {
	var settingsspush = [];
	$("ul#appsettings > li.render").each(function() {
		settingsspush.push($(this).data());
	});
	localStorage.setItem("bitrequest_settings", JSON.stringify(settingsspush));
	updatechanges("settings");
}

function save_cc_settings(currency) {
	var settingbox = {};
	$("#" + currency + "_settings ul.cc_settinglist > li").each(function() {
		var thisnode = $(this);
		settingbox[thisnode.attr("data-id")] = thisnode.data();
	});
	localStorage.setItem("bitrequest_" + currency + "_settings", JSON.stringify(settingbox));
	updatechanges("currencysettings");
}

function updatechanges(key) {
	if (GD_auth() === true) {
		updateappdata();
		body.removeClass("haschanges");
	} else {
		var cc = changes[key],
			cc_correct = (cc) ? cc : 0;
		changes[key] = cc_correct + 1;
		savechangesstats();
	}
}

function resetchanges() {
	changes = {};
	savechangesstats();
	body.removeClass("haschanges");
	$("#alert > span").text("0").attr("title", "You have 0 changes in your app");
}

function savechangesstats() {
	localStorage.setItem("bitrequest_changes", JSON.stringify(changes));
	change_alert();
}

// render changes
function renderchanges() {
	var changescache = localStorage.getItem("bitrequest_changes");
	if (changescache) {
		changes = JSON.parse(changescache),
		setTimeout(function() { // wait for Googleauth to load
			if (GoogleAuth) {} else {
				change_alert();
			}
		}, 700);
	}
	else {
		changes = {};
	}
}

function change_alert() {
	var total_changes = get_total_changes();
	if (total_changes > 0) {
		body.addClass("haschanges");
		$("#alert > span").text(total_changes).attr("title", "You have " + total_changes + " changes in your app");
	}
}

function get_total_changes() {
	var totalchanges = 0;
	$.each(changes, function(key, value) {
		var thisval = (value) ? value : 0;
		totalchanges += parseInt(thisval);
	});
	return totalchanges;
}

// ** Get_app **

function detectapp() {
	if (inframe === true) {
		return false;
	}
	else {
		var show_dialog = sessionStorage.getItem("bitrequest_appstore_dialog");
		if (show_dialog) {
			return false;
		}
		else {
			if (is_android_app === true || is_ios_app === true) {
				return false;
			}
			else {
				if (supportsTouch === true) {
					var device = getdevicetype();
					if (device == "Android") {
						getapp("android");
					}
					else if (device == "iPhone" || device == "iPad" || device == "Macintosh") {
						getapp("apple");
					}
					else {
						
					}
				}
			}
		}
	}
}

function getapp(type) {
	var app_panel = $("#app_panel");
	app_panel.html("");
	var android = (type == "android"),
		button = (android === true) ? "button-playstore-v2.svg" : "button-appstore.svg",
		url = (android === true) ? "https://play.google.com/store/apps/details?id=" + androidpackagename + "&pcampaignid=fdl_long&url=" + approot + encodeURIComponent(window.location.search) : "https://apps.apple.com/app/id1484815377?mt=8",
		panelcontent = "<h2>Download the app</h2>\
			<a href='" + url + "' class='store_bttn'><img src='img/" + button + "'></a><br/>\
			<div id='not_now'>Not now</div>";
	app_panel.html(panelcontent);
	setTimeout(function() {
		body.addClass("getapp");
	}, 1500);
}

function close_app_panel() {
	$(document).on("click touch", "#not_now", function() {
		body.removeClass("getapp");
		setTimeout(function() {
			$("#app_panel").html("");
		}, 800);
		sessionStorage.setItem("bitrequest_appstore_dialog", false); // to check if request is being edited
	});
}

// Query helpers

function get_requestli(datakey, dataval) {
	return $("#requestlist li.rqli").filter(function() {
		return $(this).data(datakey) == dataval;
	})
}