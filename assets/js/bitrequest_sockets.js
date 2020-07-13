$(document).ready(function() {
	//init_socket
	//blockchain_btc_socket
	//blockcypher_websocket
	//nano_socket
	//amberdata_eth_websocket
	//web3_erc20_websocket
	//handle_socket_fails
	//try_next_socket
	reconnect();
	
	// pick API / RPC
	
	//pick_monitor
	//api_monitor_init
	//api_monitor
	//ampl
	//rpc_monitor
	//rmpl
	//ping_eth_node
	//ping_eth_node_erc20
	//handle_rpc_monitor_fails
	//confirmations
});

// Websockets / Pollfunctions

function init_socket(socket_node, address) {
	if (offline === true) {
		notify("You are currently offline, request is not monitored");
	}
	else {
		var payment = br.payment;
		if (socket_node) {
			var socket_name = socket_node.name;
			socket_attempt[btoa(socket_node.url)] = true;
		}
		if (payment == "bitcoin") {
			closesocket();
			if (socket_name == "blockcypher websocket") {
				blockcypher_websocket(socket_node, address);
			} else if (socket_name == "blockchain.info websocket") {
				blockchain_btc_socket(socket_node, address);
			}
			else {
				blockcypher_websocket(socket_node, address);
			}
		} else if (payment == "litecoin" || payment == "dogecoin") {
			closesocket();
			blockcypher_websocket(socket_node, address);
		} else if (payment == "nano") {
			closesocket();
			nano_socket(socket_node, address);
		} else if (payment == "ethereum") {
			closesocket();
			amberdata_eth_websocket(socket_node, address);
		} else if (br.erc20 === true) {
			clearpingtx("close");
			web3_erc20_websocket(socket_node, address);
		}
		else {
			notify("this currency is not monitored", 500000, "yes")
		}
	}
}

function blockchain_btc_socket(socket_node, thisaddress) {
	var provider = socket_node.url;
	websocket = new WebSocket(provider);
    websocket.onopen = function(e) {
	    setTimeout(function() {
			chainstate("Monitoring address");
		}, 3500);
		console.log("Connected: " + provider + "/" + thisaddress);
		var ping_event = JSON.stringify({
			op: "addr_sub",
			addr: thisaddress
		});
		console.log(ping_event);
		websocket.send(ping_event);
		ping = setInterval(function() {
			websocket.send(ping_event);
		}, 55000);
    };
    websocket.onmessage = function(e) {
	    console.log(e);
	    var json = JSON.parse(e.data).x
			txhash = json.hash;
		console.log(json);
		if (txhash) {
			if (paymentdialogbox.hasClass("transacting") && txid != txhash) {
				paymentdialogbox.removeClass("transacting");
				var reconnectbttn = (txid) ? "<p style='margin-top:2em'><div class='button'><span id='reconnect' class='icon-connection' data-txid='" + txid + "'>Reconnect</span></div></p>" : "",
					content = "<h2 class='icon-blocked'>Websocket closed</h2><p>The websocket was closed due to multiple incoming transactions</p>" + reconnectbttn;
				closesocket();
				popdialog(content, "alert", "canceldialog");
			} else {
				txid = txhash;
				closesocket();
				var txd = blockcypher_poll_data(json, br.set_confirmations, br.currencysymbol, thisaddress);
				pick_monitor(txhash, txd);
			}
		}
	    
    };
    websocket.onclose = function(e) {
		chainstate("Connection ended");
		console.log("Disconnected");
		txid = null;
	};
	websocket.onerror = function(e) {
		handle_socket_fails(socket_node, "blockchain.info", thisaddress, e.data)
		return false;
	};
}

function blockcypher_websocket(socket_node, thisaddress) {
	var provider = socket_node.url + br.currencysymbol + "/main";
	websocket = new WebSocket(provider);
	websocket.onopen = function(e) {
		setTimeout(function() {
			chainstate("Monitoring address");
		}, 3500);
		console.log("Connected: " + provider + "/" + thisaddress);
		var ping_event = JSON.stringify({
			event: "tx-confirmation",
			address: thisaddress,
			token: "fed1cc815bd245f79d02f04e4f39befe",
			confirmations: 10
		});
		websocket.send(ping_event);
		ping = setInterval(function() {
			websocket.send(ping_event);
		}, 55000);
	};
	websocket.onmessage = function(e) {
		var data = JSON.parse(e.data);
		if (data.event == "pong") {} else {
			var txhash = data.hash;
			if (txhash) {
				if (paymentdialogbox.hasClass("transacting") && txid != txhash) {
					paymentdialogbox.removeClass("transacting");
					var reconnectbttn = (txid) ? "<p style='margin-top:2em'><div class='button'><span id='reconnect' class='icon-connection' data-txid='" + txid + "'>Reconnect</span></div></p>" : "",
						content = "<h2 class='icon-blocked'>Websocket closed</h2><p>The websocket was closed due to multiple incoming transactions</p>" + reconnectbttn;
					closesocket();
					popdialog(content, "alert", "canceldialog");
				} else {
					txid = txhash;
					closesocket();
					var txd = blockcypher_poll_data(data, br.set_confirmations, br.currencysymbol, thisaddress);
					pick_monitor(txhash, txd);
				}
			}
		}
	};
	websocket.onclose = function(e) {
		chainstate("Connection ended");
		console.log("Disconnected");
		txid = null;
	};
	websocket.onerror = function(e) {
		handle_socket_fails(socket_node, "blockcypher", thisaddress, e.data)
		return false;
	};
}

function nano_socket(socket_node, thisaddress) {
	var address_mod = (thisaddress.match("^xrb")) ? "nano_" + thisaddress.split("_").pop() : thisaddress, // change nano address prefix xrb_ to nano untill websocket support
		provider = socket_node.url;
	websocket = new WebSocket(provider);
	websocket.onopen = function(e) {
		setTimeout(function() {
			chainstate("Monitoring address");
		}, 3500);
		console.log("Connected: " + provider);
		var ping_event = JSON.stringify({
			action: "subscribe",
			topic: "confirmation",
			all_local_accounts: true,
			options: {
				accounts: [address_mod]
			},
			ack: true
		});
		websocket.send(ping_event);
		ping = setInterval(function() {
			websocket.send(ping_event);
		}, 55000);
	};
	websocket.onmessage = function(e) {
		var now_utc = $.now() + timezone;
		var json = JSON.parse(e.data),
			data = json.message;
		if (data) {
			var txd = nano_scan_data(data, undefined, br.currencysymbol);
			var tx_timestamp = txd.transactiontime;
			var timestamp_difference = Math.abs(tx_timestamp - now_utc);
			if (timestamp_difference < 60000) { // filter transactions longer then a minute ago
				closesocket();
				pick_monitor(data.hash, txd);
			}
		}
	};
	websocket.onclose = function(e) {
		chainstate("Connection ended", "offline");
		console.log("Disconnected");
		txid = null;
	};
	websocket.onerror = function(e) {
		var socketname = socket_node.name,
			s_name = (socketname) ? socketname : "nano Node";
		handle_socket_fails(socket_node, s_name, thisaddress, e.data);
		return false;
	};
}

function amberdata_eth_websocket(socket_node, thisaddress) {
	var socket_url = socket_node.url,
		ak = get_amberdata_apikey();
	var provider = socket_url + ak;
	websocket = new WebSocket(provider);
	websocket.onopen = function(e) {
		setTimeout(function() {
			chainstate("Monitoring address");
		}, 3500);
		console.log("Connected: " + socket_url);
		var ping_event = JSON.stringify({
	      	jsonrpc: "2.0",
	      	id: 1,
		  	method: "subscribe",
		  	params: [
		  		"address:pending_transactions",
		  		{
			  		"address":thisaddress
			  	}
			]
	    });
	    websocket.send(ping_event);
		ping = setInterval(function() {
			websocket.send(ping_event);
		}, 55000);
	};
	websocket.onmessage = function(e) {
		var data = JSON.parse(e.data),
			params = (data.params);
		if (params) {
			if (params.result.to == thisaddress.toLowerCase()) {
				var result = params.result,
					txhash = result.hash,
					txd = amberdata_poll_data(result, br.set_confirmations, br.currencysymbol);
				closesocket();
				pick_monitor(txhash, txd);
				return false;	
			}
		}
	};
	websocket.onclose = function(e) {
		chainstate("Connection ended");
		console.log("Disconnected");
		txid = null;
	};
	websocket.onerror = function(e) {
		var socketname = socket_node.name,
			s_name = (socketname) ? socketname : "Amberdata";
		handle_socket_fails(socket_node, s_name, thisaddress, e.data);
		return false;
	};
}

function web3_erc20_websocket(socket_node, thisaddress) {
	var provider_url = socket_node.url,
		if_id = get_infura_apikey(provider_url),
		provider = provider_url + if_id;
	websocket = new WebSocket(provider);
	websocket.onopen = function(e) {
		setTimeout(function() {
			chainstate("Monitoring address");
		}, 3500);
		console.log("Connected: " + provider_url);
		var ping_event = JSON.stringify({
	      	jsonrpc: "2.0",
	      	id: 1,
		  	method: "eth_subscribe",
		  	params: [
		  		"logs",
		  		{
			  		"address": br.token_contract,
			  		"topics": []
			  	}
			]
	    });
	    websocket.send(ping_event);
	};
	websocket.onmessage = function(e) {
		var dat = JSON.parse(e.data),
			params = (dat.params);
		if (params) {
			var result = params.result,
				contractdata = result.data,
				cd_hex = contractdata.slice(2),
				token_value = web3.utils.hexToNumberString(cd_hex),
				token_decimals = br.decimals,
				ccval = parseFloat((token_value / Math.pow(10, token_decimals)).toFixed(8));
			if (ccval === Infinity) {
			}
			else {
				var cryptoval = $("#shareccinputmirror > span").text(),
					urlamount = parseFloat(cryptoval).toFixed(8),
					amountnumber = parseFloat(urlamount),
					percent = (ccval / amountnumber) * 100;
				if (percent > 70 && percent < 130) { // only scan amounts with a margin less then 20%
					var txhash = result.transactionHash;
					web3.eth.getTransaction(txhash, function (err, data) {
				    	if (err) {
					    	console.log(err);
				    	}
				    	else {
					    	console.log(data);
					    	if (data) {
						    	var input = data.input,
							    	address_upper = thisaddress.slice(3).toUpperCase(),
							    	input_upper = input.toUpperCase();
								if (input_upper.indexOf(address_upper) >= 0) {
									closesocket();
									var amount_hex = input.slice(74, input.length),
										txd = infura_erc20_poll_data({
										"timestamp": parseFloat(($.now() / 1000).toFixed(0)),
										"hash": txhash,
										"confirmations": 0,
										"value": web3.utils.hexToNumberString(amount_hex),
										"decimals": token_decimals
									}, br.set_confirmations, br.currencysymbol);
									pick_monitor(txhash, txd);
									return false;
						    	}
						    }
						}	
					});
				}
			}
		}
	};
	websocket.onclose = function(e) {
		chainstate("Connection ended");
		console.log("Disconnected");
		txid = null;
	};
	websocket.onerror = function(e) {
		var socketname = socket_node.name,
			s_name = (socketname) ? socketname : "infura.io";
		handle_socket_fails(socket_node, s_name, thisaddress, e);
		return false;
	};
}

function handle_socket_fails(socket_node, socketname, thisaddress, error) {
	var next_socket = try_next_socket(socket_node);
	if (next_socket === false) {
		console.log(error);
		fail_dialogs(socketname, "unable to connect to " + socketname);
		notify("this currency is not monitored", 500000, "yes");
	} else {
		closesocket();
		init_socket(next_socket, thisaddress);
	}
}

function try_next_socket(current_socket_data) {
	if (current_socket_data) {
		var current_socket_url = current_socket_data.url,
			sockets = helper.socket_list,
			socketlist = (sockets.options) ? $.merge(sockets.apis, sockets.options) : sockets.apis,
			socket_index;
		$.each(socketlist, function(i, val) {
			if (val.url == current_socket_url) {
				socket_index = i;
			}
		});
		if (socket_index !== undefined) {
			var next_scan = socketlist[socket_index + 1],
				next_socket = (next_scan) ? next_scan : socketlist[0];
			if (socket_attempt[btoa(next_socket.url)] === true) {
				return false;
			}
			else {
				return next_socket;
			}
		}
	}
	else {
		return false;
	}
}

function reconnect() {
	$(document).on("click touch", "#reconnect", function() {
		var txhash = $(this).attr("data-txid");
		canceldialog();
		pick_monitor(txhash);
	});
}

// pick API / RPC

function pick_monitor(txhash, tx_data) {
	var api_info = check_api(br.payment);
	if (api_info.api === true) {
		api_monitor_init(api_info.data, txhash, tx_data);
	}
	else {
		rpc_monitor(api_info.data, txhash, tx_data);
	}
}

function api_monitor_init(api_data, txhash, tx_data) {
	api_attempts[api_data.name] = undefined;
	api_monitor(api_data, txhash, tx_data);
	paymentdialogbox.addClass("transacting");
	setTimeout(function() {
		chainstate("Monitoring transaction");
	}, 3500);
}

function api_monitor(api_data, txhash, tx_data) {
	var direct = (tx_data !== undefined),
		payment = br.payment,
		api_name = api_data.name,
		currencysymbol = br.currencysymbol,
		set_confirmations = br.set_confirmations;
	if (api_name === false) {
		console.log("No API selected");
	}
	else {
		var poll_url = (api_name == "blockcypher") ? currencysymbol + "/main/txs/" + txhash :
			(api_name == "ethplorer") ? "getTxInfo/" + txhash :
			(api_name == "blockchair") ? (br.erc20 === true) ? "ethereum/dashboards/transaction/" + txhash + "?erc_20=true" : payment + "/dashboards/transaction/" + txhash : "";
		if (direct === true) {
			confirmations(tx_data, true);
			pingtx = setInterval(function() {
				api_proxy(ampl(api_name, poll_url)).done(function(e) {
					api_result(result(e));
				}).fail(function(jqXHR, textStatus, errorThrown) {
					api_error(jqXHR, textStatus, errorThrown);
				});
			}, 25000);
		}
		else {
			api_proxy(ampl(api_name, poll_url)).done(function(e) {
				api_result(result(e));
				pingtx = setInterval(function() {
					api_proxy(ampl(api_name, poll_url)).done(function(e) {
						api_result(result(e));
					}).fail(function(jqXHR, textStatus, errorThrown) {
						api_error(jqXHR, textStatus, errorThrown);
					});
				}, 25000);
			}).fail(function(jqXHR, textStatus, errorThrown) {
				api_error(jqXHR, textStatus, errorThrown);
			});
		}
		function api_result(data) {
			if (data.error) {
				clearpingtx();
				handle_api_fails(false, data.error, api_name, payment, txhash);
				return false;
			}
			else {
				var currentaddress = geturlparameters().address,
					txd = (api_name == "blockcypher") ? blockcypher_poll_data(data, set_confirmations, currencysymbol, currentaddress) :
						(api_name == "ethplorer") ? ethplorer_poll_data(data, set_confirmations, currencysymbol) :
						(api_name == "blockchair") ? 
							(br.erc20 === true) ? blockchair_erc20_poll_data(data.data[txhash], set_confirmations, currencysymbol, data.context.state) :
							(payment == "ethereum") ? blockchair_eth_scan_data(data.data[txhash].calls[0], set_confirmations, currencysymbol, data.context.state) :
						blockchair_scan_data(data.data[txhash], set_confirmations, currencysymbol, currentaddress, data.context.state) :
					false;
				confirmations(txd);
			}
		};
		function api_error(jqXHR, textStatus, errorThrown) {
			clearpingtx();
			var error_object = (errorThrown) ? errorThrown : jqXHR;
			handle_api_fails(false, error_object, api_name, payment, txhash);
			return false;
		}
	}
	console.log("source: " + api_name);
}

function ampl(api_name, poll_url) { // api_monitor payload
	return {
		"api": api_name,
		"search": poll_url,
		"cachetime": 10,
		"cachefolder": "1h",
		"params": {
			"method": "GET",
			"cache": true
		}
	}
}

function rpc_monitor(rpcdata, txhash, tx_data) {
	var direct = (tx_data !== undefined),
		payment = br.payment,
		rpcurl = rpcdata.url;
	if (payment == "bitcoin" || payment == "litecoin" || payment == "dogecoin") {
		if (direct === true) {
			confirmations(tx_data, true);
			pingtx = setInterval(function() {
				api_proxy(rmpl(payment, rpcurl, txhash)).done(function(e) {
					rpc_result(result(e));
				}).fail(function(jqXHR, textStatus, errorThrown) {
					rpc_error(jqXHR, textStatus, errorThrown);
				});
			}, 25000);
		}
		else {
			api_proxy(rmpl(payment, rpcurl, txhash)).done(function(e) {
				rpc_result(result(e));
				pingtx = setInterval(function() {
					api_proxy(rmpl(payment, rpcurl, txhash)).done(function(e) {
						rpc_result(result(e));
					}).fail(function(jqXHR, textStatus, errorThrown) {
						rpc_error(jqXHR, textStatus, errorThrown);
					});
				}, 25000);
			}).fail(function(jqXHR, textStatus, errorThrown) {
				rpc_error(jqXHR, textStatus, errorThrown);
			});
		}
		function rpc_result(data) {
			if (data.error) {
				clearpingtx();
				handle_rpc_monitor_fails(rpcdata, data.error, txhash);
				return false;
	        }
	        else {
		        if (data.result.confirmations) {
			        var currentaddress = geturlparameters().address;
			        var txd = bitcoin_rpc_data(data.result, br.set_confirmations, br.currencysymbol, currentaddress);
			        confirmations(txd);
		        }
	        }
		};
		function rpc_error(jqXHR, textStatus, errorThrown) {
			clearpingtx();
			var error_object = (errorThrown) ? errorThrown : jqXHR;
			handle_rpc_monitor_fails(rpcdata, error_object, txhash);
			return false;
		}
	}
	else if (payment == "ethereum") {
		if (direct === true) {
			confirmations(tx_data, true);
		}
		else {
			ping_eth_node(rpcdata, txhash);
		}
		pingtx = setInterval(function() {
			ping_eth_node(rpcdata, txhash);	
		}, 25000);
	}
	else if (br.erc20 === true) {
		if (direct === true) {
			confirmations(tx_data, true);
		}
		else {
			ping_eth_node_erc20(rpcdata, txhash);
		}
		pingtx = setInterval(function() {
			ping_eth_node_erc20(rpcdata, txhash);	
		}, 25000);
	}
	else if (payment == "nano") {
		if (direct === true) {
			confirmations(tx_data, true);
		}
		else {
			// nano payment with confirmations
		}
	}
	console.log("source: " + rpcurl);
}

function rmpl(payment, rpcurl, txhash) { // rpc_monitor payload
	return {
		"api": payment,
		"search": "txid",
		"cachetime": 10,
		"cachefolder": "1h",
		"api_url": rpcurl,
		"params": {
			"method": "POST",
			"data": JSON.stringify({
				"method": "getrawtransaction",
				"params": [txhash, true]
			}),
			"headers": {
	        	"Content-Type": "text/plain"
	    	}
		}
	}
}

function ping_eth_node(rpcdata, txhash) {
	if (web3) {
		var rpcurl = rpcdata.url + get_infura_apikey(rpcdata.url);
		if (web3.currentProvider.host == rpcurl) {
		}
		else {
			web3.setProvider(rpcurl);
		}
		web3.eth.getBlockNumber(function (err_1, data_1) {
			if (err_1) {
				console.log(err_1);
				clearpingtx();
				handle_rpc_monitor_fails(rpcdata, err_1, txhash);
				return false;
			}
			else {
				if (data_1) {
					var current_blocknumber = data_1;
					web3.eth.getTransaction(txhash, function (err_2, data_2) {
						if (err_2) {
							console.log(err_2);
							clearpingtx();
							handle_rpc_monitor_fails(rpcdata, err_2, txhash);
							return false;
						}
						else {
							if (data_2) {
								var this_blocknumber = data_2.blockNumber;
								web3.eth.getBlock(this_blocknumber, function (err_3, data_3) {
									if (err_3) {
										console.log(err_3);
										clearpingtx();
										handle_rpc_monitor_fails(rpcdata, err_3, txhash);
										return false;
									}
									else {
										var conf = current_blocknumber - this_blocknumber,
											conf_correct = (conf < 0) ? 0 : conf,
											txdata = {
												"timestamp": data_3.timestamp,
												"hash": txhash,
												"confirmations": conf_correct,
												"value": data_2.value,
												"decimals" : 18
											},
											txd = infura_eth_poll_data(txdata, br.set_confirmations, br.currencysymbol);
										confirmations(txd);
									}
								});
							}
						}
					});
				}
				else {
					clearpingtx();
					handle_rpc_monitor_fails(rpcdata, false, txhash);
					return false;
				}
			}
		});
	}
	else {
		handle_rpc_monitor_fails(txhash);
		return false;
	}
}
	
function ping_eth_node_erc20(rpcdata, txhash) {
	if (web3) {
		var rpcurl = rpcdata.url + get_infura_apikey(rpcdata.url);
		if (web3.currentProvider.host == rpcurl) {
		}
		else {
			web3.setProvider(rpcurl);
		}
		web3.eth.getBlockNumber(function (err_1, data_1) {
			if (err_1) {
				console.log(err_1);
				clearpingtx();
				handle_rpc_monitor_fails(rpcdata, err_1, txhash);
				return false;
			}
			else {
				if (data_1) {
					var current_blocknumber = data_1;
					web3.eth.getTransaction(txhash, function (err_2, data_2) {
						if (err_2) {
							console.log(err_2);
							clearpingtx();
							handle_rpc_monitor_fails(rpcdata, err_2, txhash);
							return false;
						}
						else {
							if (data_2) {
								var this_blocknumber = data_2.blockNumber;
								web3.eth.getBlock(this_blocknumber, function (err_3, data_3) {
									if (err_3) {
										console.log(err_3);
										clearpingtx();
										handle_rpc_monitor_fails(rpcdata, err_3, txhash);
										return false;
									}
									else {
										if (data_3) {
											var input = data_2.input,
												amount_hex = input.slice(74, input.length),
										    	tokenValue = web3.utils.hexToNumberString(amount_hex),
												conf = current_blocknumber - this_blocknumber,
												conf_correct = (conf < 0) ? 0 : conf,
												txdata = {
													"timestamp": data_3.timestamp,
													"hash": txhash,
													"confirmations": conf_correct,
													"value": tokenValue,
													"decimals": br.decimals
												},
												txd = infura_erc20_poll_data(txdata, br.set_confirmations, br.currencysymbol);
											confirmations(txd);
										}
									}
								});
							}
						}
					});
				}
				else {
					clearpingtx();
					handle_rpc_monitor_fails(rpcdata, false, txhash);
					return false;
				}
			}
		});
	}
	else {
		clearpingtx();
		handle_rpc_monitor_fails(rpcdata, false, txhash);
		return false;
	}
}

function handle_rpc_monitor_fails(rpcdata, error, txhash) {
	var this_coinsettings = getcoinsettings(payment),
		api_data = this_coinsettings.apis.selected, // get api source
		apiurl = api_data.url;
	if (apiurl == rpcdata.url) {
		var error_object = (error === false) ? false : get_rpc_error_data(error);
		rpc_eror_msg(rpcdata.name, error_object, true);
	}
	else {
		api_monitor_init(api_data, txhash); // retry with api source
	}
}

function confirmations(tx_data, direct) {
	if (tx_data === false || tx_data.ccval === undefined) {
		return false;
	}
	var brstatuspanel = $("#paymentdialogbox .brstatuspanel"),
		setconfirmations = tx_data.setconfirmations,
		conf_text = (setconfirmations) ? setconfirmations.toString() : "",
		confbox = brstatuspanel.find("span.confbox"),
		confboxspan = confbox.find("span"),
		currentconf = parseFloat(confboxspan.attr("data-conf")),
		xconf = (tx_data.confirmations) ? tx_data.confirmations : 0,
		txhash = tx_data.txhash,
		zero_conf = (xconf === false || setconfirmations === 0 || setconfirmations == "undefined" || setconfirmations === undefined);
	brstatuspanel.find("span#confnumber").text(conf_text);
	if (xconf > currentconf || zero_conf === true || direct === true) {
		sessionStorage.removeItem("bitrequest_txstatus"); // remove cached historical exchange rates
		playsound(blip);
		confbox.removeClass("blob");
		setTimeout(function() {
			confbox.addClass("blob");
			confboxspan.text(xconf).attr("data-conf", xconf);
		}, 500);
		var brheader = brstatuspanel.find("h2"),
			receivedutc = tx_data.transactiontime,
			receivedtime = receivedutc - timezone,
			receivedcc = tx_data.ccval,
			thiscurrency = br.uoa,
			currencysymbol = br.currencysymbol,
			requesttype = br.requesttype,
			iscrypto = (thiscurrency == currencysymbol),
			fiatvalue = (iscrypto === true) ? null : parseFloat((receivedcc / $("#paymentdialogbox .ccpool").attr("data-xrate")) * $("#paymentdialog .cpool[data-currency='" + thiscurrency + "']").attr("data-xrate")), // calculate fiat value
			fiatrounded = (iscrypto === true) ? null : fiatvalue.toFixed(2),
			requestamount = parseFloat(br.amount),
			receivedamount = (iscrypto === true) ? receivedcc : fiatvalue;
		// extend global request object
		$.extend(br, {
			inout : requesttype,
			receivedamount: receivedcc,
			fiatvalue: fiatvalue,
			paymenttimestamp: receivedutc,
			txhash : txhash,
			confirmations : xconf
			}
		);
		if (iscrypto === false) {
			brstatuspanel.find("span.receivedfiat").text(" (" + fiatrounded + " " + thiscurrency + ")");
		}
		brstatuspanel.find("span.paymentdate").html(fulldateformat(new Date(receivedtime), "en-us"));
		if (receivedamount >= requestamount * 0.95) {
			if (xconf >= setconfirmations || zero_conf === true) {
				clearpingtx();
				closesocket();
				playsound(cashier);
				paymentdialogbox.addClass("transacting").attr("data-status", "paid");
				var confirmationtext = (requesttype === "incoming") ? "Payment sent" : "Payment received";
				brheader.text(confirmationtext);
				br.status = "paid",
				br.pending = "polling";
				saverequest(direct);
				$("span#ibstatus").fadeOut(500);
			}
			else {
				playsound(blip);
				paymentdialogbox.addClass("transacting").attr("data-status", "pending");
				brheader.text("Transaction broadcasted");
				br.status = "pending",
				br.pending = "polling";
				saverequest(direct);
			}
		} else {
			playsound(funk);
			brheader.text("Insufficient amount");
			paymentdialogbox.addClass("transacting").attr("data-status", "insufficient");
			br.status = "insufficient",
			br.pending = "scanning";
			saverequest(direct);
		}
		brstatuspanel.find("#view_tx").attr("data-txhash", txhash);	
	}
	else {
	}
}