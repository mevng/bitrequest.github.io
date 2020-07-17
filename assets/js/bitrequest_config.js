var version = 0.028,
	apptitle = "Bitrequest",
	hostname = "app.bitrequest.io", // change if self hosted
	root = "/",
	localhostname = (hostname.indexOf("http") > -1) ? hostname.split("://").pop() : hostname,
	approot = "https://" + localhostname + root,
	firebase_dynamic_link_domain = "bitrequest.page.link",
	firebase_shortlink = "https://" + firebase_dynamic_link_domain + "/",
	androidpackagename = "io.bitrequest.app",
	main_eth_node = "https://mainnet.infura.io/v3/",
	eth_node2 = "https://ropsten.infura.io/v3/",
	main_eth_socket = "wss://mainnet.infura.io/ws/v3/",
	eth_socket2 = "wss://ropsten.infura.io/ws/v3/",
	main_ad_node = "https://web3api.io/api/v2/",
	main_ad_socket = "wss://ws.web3api.io/",
	socket_attempt = {},
	api_attempt = {},
	api_attempts = {},
	rpc_attempts = {},
	changes = {};

var bitrequest_coin_data = [
	{
		"currency": "bitcoin",
		"data": {
			"currency": "bitcoin",
			"ccsymbol": "btc",
			"cmcid": 1,
			"urlscheme": null,
			"address_regex": "^([13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[ac-hj-np-zAC-HJ-NP-Z02-9]{11,71})$"
		},
	    "settings": {
		    "confirmations": {
				"icon": "clock",
				"selected": 0
			},
			"showsatoshis": {
				"icon": "eye",
				"selected": false
			},
			"blockexplorers": {
				"icon": "eye",
				"selected": "blockchain.com",
			    "options": {
					"key1": "blockchain.com",
					"key2": "blockchair.com"
		    	}
			},
			"apis": {
				"icon": "sphere",
				"selected":{
					"name": "blockcypher",
					"url": "blockcypher.com",
					"api": true,
					"display": true
		    	},
		    	"apis":[
					{
						"name": "blockcypher",
						"url": "blockcypher.com",
						"api": true,
						"display": true
			    	},
			    	{
						"name": "blockchair",
						"url": "blockchair.com",
						"api": true,
						"display": false
			    	}
		    	],
		    	"options": [],
		    	"rpc_test_command": {
					"method": "getblockchaininfo"
		    	}
			},
			"websockets": {
				"icon": "tab",
				"selected":{
					"name": "blockcypher websocket",
					"url": "wss://socket.blockcypher.com/v1/",
					"display": true
		    	},
		    	"apis": [
					{
						"name": "blockcypher websocket",
						"url": "wss://socket.blockcypher.com/v1/",
						"display": true
			    	},
			    	{
				    	"name": "blockchain.info websocket",
						"url": "wss://ws.blockchain.info/inv/",
						"display": false
			    	}
		    	]
	    	}
	    }
	},
	{
	    "currency": "monero",
	    "data": {
			"currency": "monero",
			"ccsymbol": "xmr",
			"cmcid": "328",
			"urlscheme": null,
			"address_regex": "^[48](?:[0-9AB]|[1-9A-HJ-NP-Za-km-z]{12}(?:[1-9A-HJ-NP-Za-km-z]{30})?)[1-9A-HJ-NP-Za-km-z]{93}$"
		}
	},
	{
		"currency": "litecoin",
		"data": {
			"currency": "litecoin",
			"ccsymbol": "ltc",
			"cmcid": 2,
			"urlscheme": null,
			"address_regex": "^([LM][a-km-zA-HJ-NP-Z1-9]{26,33}|ltc1[a-zA-HJ-NP-Z0-9]{26,39})$"
		},
	    "settings": {
		    "confirmations": {
				"icon": "clock",
				"selected": 0
			},
			"blockexplorers": {
				"icon": "eye",
				"selected": "blockchair.com"
			},
			"apis": {
				"icon": "sphere",
				"selected":{
					"name": "blockcypher",
					"url": "blockcypher.com",
					"api": true,
					"display": true
		    	},
		    	"apis": [
					{
						"name": "blockcypher",
						"url": "blockcypher.com",
						"api": true,
						"display": true
			    	},
			    	{
						"name": "blockchair",
						"url": "blockchair.com",
						"api": true,
						"display": false
			    	}
		    	],
		    	"options": [],
		    	"rpc_test_command": {
					"method": "getblockchaininfo"
		    	}
			},
			"websockets": {
				"icon": "tab",
				"selected":{
					"name": "blockcypher websocket",
					"url": "wss://socket.blockcypher.com/v1/",
					"display": true
		    	}
	    	}
	    }
	},
	{
		"currency": "dogecoin",
		"data": {
			"currency": "dogecoin",
			"ccsymbol": "doge",
		    "cmcid": 74,
		    "urlscheme": null,
		    "address_regex": "^D{1}[5-9A-HJ-NP-U]{1}[1-9A-HJ-NP-Za-km-z]{32}$"
		},
	    "settings": {
		    "confirmations": {
				"icon": "clock",
				"selected": 0
			},
			"blockexplorers": {
				"icon": "eye",
				"selected": "blockchair.com"
			},
			"apis": {
				"icon": "sphere",
				"selected":{
					"name": "blockcypher",
					"url": "blockcypher.com",
					"api": true,
					"display": true
		    	},
		    	"apis": [
					{
						"name": "blockcypher",
						"url": "blockcypher.com",
						"api": true,
						"display": true
			    	},
		         	{
			         	"name": "blockchair",
		            	"url": "blockchair.com",
		            	"api": true,
						"display": false
		         	}
		    	],
		    	"options": [],
		    	"rpc_test_command": {
					"method": "getblockchaininfo"
		    	}
			},
			"websockets": {
				"icon": "tab",
				"selected":{
					"name": "blockcypher websocket",
					"url": "wss://socket.blockcypher.com/v1/",
					"display": true
		    	}
	    	}
	    }
	},
	{
		"currency": "nano",
		"data": {
			"currency": "nano",
			"ccsymbol": "nano",
		    "cmcid": 1567,
			"urlscheme": null,
			"address_regex": "^(xrb|nano)_([a-z1-9]{60})$"
		},
	    "settings": {
		    "blockexplorers": {
				"icon": "eye",
				"selected": "nanocrawler.cc"
			},
			"apis": {
				"icon": "sphere",
				"selected":{
					"name": "nano node",
					"url": "https://www.bitrequest.app:8020",
					"username": "",
					"password": "",
					"display": true
		    	},
				"apis": [
					{
						"name": "nano node",
						"url": "https://www.bitrequest.app:8020",
						"username": "",
						"password": "",
						"display": true
			    	}
		    	],
		    	"options": [],
		    	"rpc_test_command": {
					"action": "version"
		    	}
			},
			"websockets": {
				"icon": "tab",
				"selected":{
					"name": "nano socket",
					"url": "wss://bitrequest.app:8010",
					"display": true
		    	},
		    	"apis": [
					{
						"name": "nano socket",
						"url": "wss://bitrequest.app:8010",
						"display": true
			    	},
			    	{
						"name": "nano.cc websocket",
						"url": "wss://socket.nanos.cc",
						"display": true
			    	}
		    	],
		    	"options": []
	    	}
	    }
	},
	{
		"currency": "ethereum",
		"data": {
			"currency": "ethereum",
			"ccsymbol": "eth",
		    "cmcid": 1027,
		    "urlscheme": null,
		    "address_regex": "web3"
		},
	    "settings" : {
		    "confirmations": {
				"icon": "clock",
				"selected": 0
			},
			"blockexplorers": {
				"icon": "eye",
				"selected": "blockchain.com",
				"options": {
					"blockchain": "blockchain.com",
					"blockchair": "blockchair.com"
		    	}
			},
			"apis": {
				"icon": "sphere",
				"selected":{
					"name": "blockcypher",
					"url": "blockcypher.com",
					"api": true,
					"display": true
		    	},
		    	"apis": [
					{
						"name": "blockcypher",
						"url": "blockcypher.com",
						"api": true,
						"display": true
			    	},
		         	{
			         	"name": "blockchair",
		            	"url": "blockchair.com",
		            	"api": true,
						"display": false
		         	},
		         	{
						"name": main_eth_node,
						"url": main_eth_node,
						"display": true
			    	},
			    	{
						"name": eth_node2,
						"url": eth_node2,
						"display": true
			    	}
		    	],
		    	"options": [],
		    	"rpc_test_command": {
					"method": null
		    	}
			},
			"websockets": {
				"icon": "tab",
				"selected":{
					"name": main_ad_socket,
					"url": main_ad_socket,
					"display": true
		    	},
		    	"apis": [
					{
						"name": main_ad_socket,
						"url": main_ad_socket,
						"display": true
			    	}
		    	],
		    	"options": []
	    	}
	    }
	}
]

var erc20_settings = {
	"confirmations": {
	    "icon": "clock",
	    "selected": 0
    },
    "blockexplorers": {
      	"icon": "eye",
	  	"selected": "ethplorer.io",
	  	"options": {}
    },
	"apis": {
      	"icon": "sphere",
	  	"selected":{
		  	"name": "ethplorer",
         	"url": "ethplorer.io",
         	"api": true,
		 	"display": true
      	},
	  	"apis": [
         	{
	         	"name": "ethplorer",
            	"url": "ethplorer.io",
            	"api": true,
				"display": true
         	},
         	{
	         	"name": "blockchair",
            	"url": "blockchair.com",
            	"api": true,
				"display": true
         	},
         	{
				"name": main_eth_node,
				"url": main_eth_node,
				"display": true
	    	},
	    	{
				"name": eth_node2,
				"url": eth_node2,
				"display": true
	    	}
      	],
    	"options": [],
	  	"rpc_test_command": {
        	"method": null
      	}
   	},
	"websockets": {
		"icon": "tab",
		"selected":{
			"name": main_eth_socket,
			"url": main_eth_socket,
			"display": true
    	},
    	"apis": [
			{
				"name": main_eth_socket,
				"url": main_eth_socket,
				"display": true
	    	},
	    	{
				"name": eth_socket2,
				"url": eth_socket2,
				"display": true
	    	}
    	],
    	"options": []
	}
}

var app_settings = [
	{
		"id": "accountsettings",
		"heading": "Account name",
	   	"selected": "Bitrequest",
	   	"icon": "icon-user"
	},
	{
		"id": "currencysettings",
	    "heading": "Local Fiat Currency",
	   	"selected": "EUR | Euro",
	   	"icon": "icon-coin-dollar",
	   	"currencysymbol": "eur",
	   	"default": false
	},
	{
		"id": "pinsettings",
		"heading": "Security",
	   	"selected": "pincode disabled",
	   	"icon": "icon-lock",
	   	"locktime": 0,
	   	"pinhash": null
	},
	{
		"id": "backup",
	    "heading": "Backup",
	   	"selected": null,
	   	"icon": "icon-download",
	   	"lastbackup": null
	},
	{
		"id": "restore",
		"heading": "Restore from backup",
	   	"selected": null,
	   	"icon": "icon-upload",
	   	"fileused": null,
	   	"device": null
	},
	{
		"id": "cmcapisettings",
	   	"heading": "Cryptocurrency price API",
	   	"selected": "coinmarketcap",
	   	"icon": "icon-stats-dots",
	   	"cmcapikey": null
	},
	{
		"id": "fiatapisettings",
	 	"heading": "FIAT price API",
	   	"selected": "fixer",
	   	"icon": "icon-stats-bars",
	   	"fxapikey": null
	},
	{
		"id": "url_shorten_settings",
		"heading": "Url shortener",
	   	"selected": "firebase",
	   	"icon": "icon-link",
	   	"us_active": "active",
	   	"bitly_at": null,
	   	"fbapikey": null
	},
	{
		"id": "apikeys",
		"heading": "API Keys",
	   	"selected": "Api Keys",
	   	"icon": "icon-key",
	   	"bitly": null,
	   	"firebase": null,
	   	"coinmarketcap": null,
	   	"fixer": null,
	   	"blockcypher": null,
	   	"ethplorer": null,
	   	"blockchair": null,
	   	"currencylayer": null,
	   	"infura": null,
	   	"amberdata": null
	},
	{
		"id": "themesettings",
	    "heading": "Choose theme",
	   	"selected": "default.css",
	   	"icon": "icon-paint-format"
	},
	{
		"id": "contactform",
		"heading": "Contact form",
	   	"selected": "Contact form",
	   	"icon": "icon-sphere",
	   	"name": "",
	   	"address": "",
	   	"zipcode": "",
	   	"city": "",
	   	"country": "",
	   	"email": ""
	},
	{
		"id": "cachecontrol",
	    "heading": "Cache control / updates",
	   	"selected": "",
	   	"icon": "icon-database"
	}
]

var apis = [
	{
		"name": "blockcypher",
		"base_url": "https://api.blockcypher.com/v1/",
		"key_param": "token=",
		"api_key": null,
		"sign_up": "https://accounts.blockcypher.com/"
	},
	{
		"name": "ethplorer",
		"base_url": "https://api.ethplorer.io/",
		"key_param": "apiKey=",
		"api_key": null,
		"sign_up": "https://ethplorer.io/wallet/#"
	},
	{
		"name": "blockchair",
		"base_url": "https://api.blockchair.com/",
		// for now no api key needed yet
		// "key_param": "key=",
		"key_param": null,
		"api_key": null,
		"sign_up": "https://blockchair.com/api"
	},
	{
		"name": "coinmarketcap",
		"base_url": "https://pro-api.coinmarketcap.com/v1/",
		"key_param": "CMC_PRO_API_KEY=",
		"api_key": null,
		"sign_up": "https://pro.coinmarketcap.com/signup/"
	},
	{
		"name": "coingecko",
		"base_url": "https://api.coingecko.com/api/v3/",
		"key_param": null,
		"api_key": null,
		"sign_up": null
	},
	{
		"name": "coinpaprika",
		"base_url": "https://api.coinpaprika.com/v1/tickers/",
		"key_param": null,
		"api_key": null,
		"sign_up": null
	},
	{
		"name": "fixer",
		"base_url": "http://data.fixer.io/api/",
		"key_param": "access_key=",
		"api_key": null,
		"sign_up": "https://fixer.io/signup/free/"
	},
	{
		"name": "exchangeratesapi",
		"base_url": "https://api.exchangeratesapi.io/",
		"key_param": null,
		"api_key": null,
		"sign_up": null
	},
	{
		"name": "currencylayer",
		"base_url": "http://api.currencylayer.com/",
		"key_param": "access_key=",
		"api_key": null,
		"sign_up": "https://currencylayer.com/product"
	},
	{
		"name": "bitly",
		"base_url": "https://api-ssl.bitly.com/v4/",
		"key_param": "post",
		"api_key": null,
		"sign_up": "https://bitly.com/a/sign_up/"
	},
	{
		"name": "firebase",
		"base_url": "https://firebasedynamiclinks.googleapis.com/v1/",
		"key_param": "key=",
		"api_key": null,
		"sign_up": "https://firebase.google.com/"
	},
	{
		"name": "infura",
		"base_url": main_eth_node,
		"key_param": null,
		"api_key": null,
		"sign_up": "https://infura.io/register"
	},
	{
		"name": "amberdata",
		"base_url": main_ad_node,
		"key_param": null,
		"api_key": null,
		"sign_up": "https://amberdata.io/onboarding"
	},
	{
		"name": "google_auth",
		"base_url": null,
		"key_param": null,
		"api_key": null,
		"sign_up": "https://developers.google.com/"
	}
]

var apilists = {
	"crypto_price_apis": ["coinmarketcap","coinpaprika","coingecko"],
	"fiat_price_apis": ["fixer","coingecko","exchangeratesapi","currencylayer"],
	"historic_crypto_price_apis": ["coinpaprika","coingecko"],
	"historic_fiat_price_apis": ["fixer","exchangeratesapi","currencylayer"]
}

var blockexplorers = [
	{
		"name": "blockchain.com",
		"url": "https://www.blockchain.com/",
		"prefix": "currencysymbol",
		"tx_prefix": "tx/",
	   	"address_prefix": "address/"
	},
	{
		"name": "blockchair.com",
		"url": "https://www.blockchair.com/",
		"prefix": "currency",
		"tx_prefix": "transaction/",
	   	"address_prefix": "address/"
	},
	{
		"name": "nanocrawler.cc",
		"url": "https://nanocrawler.cc/",
		"prefix": "explorer",
		"tx_prefix": "block/",
	   	"address_prefix": "account/"
	},
	{
		"name": "ethplorer.io",
		"url": "https://ethplorer.io/",
		"prefix": null,
		"tx_prefix": "tx/",
	   	"address_prefix": "address/"
	},
]

var abi_default = [{
	    "constant": true,
	    "inputs": [],
	    "name": "name",
	    "outputs": [{
	    	"name": "",
	        "type": "string"
	    }],
	    "payable": false,
	    "type": "function"
	},
	{
	    "constant": true,
	    "inputs": [],
	    "name": "decimals",
	    "outputs": [{
	        "name": "",
	        "type": "uint8"
	    }],
	    "payable": false,
	    "type": "function"
	},
	{
	    "constant": true,
	    "inputs": [{
	        "name": "_owner",
	        "type": "address"
	    }],
	    "name": "balanceOf",
	    "outputs": [{
	        "name": "balance",
	        "type": "uint256"
	    }],
	    "payable": false,
	    "type": "function"
	},
	{
	    "constant": true,
	    "inputs": [],
	    "name": "symbol",
	    "outputs": [{
	        "name": "",
	        "type": "string"
	    }],
	    "payable": false,
	    "type": "function"
}]

// API Templates

function default_tx_data() {
	return {
		"ccval": null,
		"transactiontime": null,
		"txhash": null,
		"confirmations": null,
		"setconfirmations": null,
		"ccsymbol": null
	};
}

// API templates

function blockchain_poll_data(data, setconfirmations, ccsymbol, address) { // poll blockchain.info websocket data
	if (data) {
		var outputs = data.out;
		if (outputs) {
			var outputsum = 0;
	        $.each(outputs, function(dat, value) {
	            var output_address = value.addr,
					output_address_upper = output_address.toUpperCase(),
					output = (output_address_upper == address.toUpperCase()) ? Math.abs(value.value) : 0;
	            outputsum += parseFloat(output) || 0; // sum of outputs
	        });
	    }
	   return {
			"ccval": (outputs) ? outputsum / 100000000 : null,
			"transactiontime": data.time * 1000,
			"txhash": data.hash,
			"confirmations": confirmations,
			"setconfirmations": (data.confirmations) ? data.confirmations : null,
			"ccsymbol": ccsymbol
		};
	}
	else {
		 return default_tx_data();
	}
}

function blockcypher_scan_data(data, setconfirmations, ccsymbol) { // scan
	if (data) {
		var is_eth = (ccsymbol == "eth");
		var datetimeparts = (data.confirmed) ? data.confirmed.split("T") : null;
		var transactiontime = (datetimeparts) ? returntimestamp(makedatestring(datetimeparts)).getTime() : null;
		var ccval = (data.value) ? (is_eth === true) ? parseFloat((data.value / Math.pow(10, 18)).toFixed(8)) : data.value / 100000000 : null;
		var txhash = data.tx_hash;
	    var txhash_mod = (txhash) ? (is_eth === true) ? (txhash.match("^0x")) ? txhash : "0x" + txhash : txhash : null;
		var confirmations = (data.confirmations) ? data.confirmations : null;
	    return {
			"ccval": ccval,
			"transactiontime": transactiontime,
			"txhash": txhash_mod,
			"confirmations": confirmations,
			"setconfirmations": setconfirmations,
			"ccsymbol": ccsymbol
		};
	}
	else {
		 return default_tx_data();
	}
}

function blockcypher_poll_data(data, setconfirmations, ccsymbol, address) { // poll
	if (data) {
		var is_eth = (ccsymbol == "eth");
		var datetimeparts = (data.received) ? data.received.split("T") : null;
		var transactiontime = (datetimeparts) ? returntimestamp(makedatestring(datetimeparts)).getTime() : null;
		var outputs = data.outputs;
		if (outputs) {
			var outputsum = 0;
	        $.each(outputs, function(dat, value) {
	            var satval = value.value;
	            var output_address = value.addresses[0].slice(3);
	            var output_address_upper = output_address.toUpperCase();
	            var adress_upper = address.toUpperCase();
	            var output = (adress_upper.indexOf(output_address_upper) >= 0) ? Math.abs(satval) : 0;
	            outputsum += parseFloat(output) || 0; // sum of outputs
	        });
	    }
	    var ccval = (outputs) ? (is_eth === true) ? parseFloat((outputsum / Math.pow(10, 18)).toFixed(8)) : outputsum / 100000000 : null;
	    var txhash = data.hash;
	    var txhash_mod = (txhash) ? (is_eth === true) ? (txhash.match("^0x")) ? txhash : "0x" + txhash : txhash : null;
        var confirmations = (data.confirmations) ? data.confirmations : null;
	    return {
			"ccval": ccval,
			"transactiontime": transactiontime,
			"txhash": txhash_mod,
			"confirmations": confirmations,
			"setconfirmations": setconfirmations,
			"ccsymbol": ccsymbol
		};
	}
	else {
		 return default_tx_data();
	}
}

function blockchair_scan_data(data, setconfirmations, ccsymbol, address, latestblock) { // scan/poll
	if (data) {
		var transaction = data.transaction;
		var transactiontime = (transaction) ? returntimestamp(transaction.time).getTime() : null;
		var confirmations = (transaction.block_id && latestblock) ? latestblock - transaction.block_id : null;
	    var outputs = data.outputs;
	    if (outputs) {
		    var outputsum = 0;
		    $.each(outputs, function(dat, val) {
		        var satval = val.value;
		        var output = (val.recipient == address) ? Math.abs(satval) : 0;
		        outputsum += parseFloat(output) || 0; // sum of outputs
		    });
	    }
	    var ccval = (outputs) ? outputsum / 100000000 : null;
	    var txhash = (transaction) ? transaction.hash : null; 
	    return {
			"ccval": ccval,
			"transactiontime": transactiontime,
			"txhash": txhash,
			"confirmations": confirmations,
			"setconfirmations": setconfirmations,
			"ccsymbol": ccsymbol
		};
	}
	else {
		 return default_tx_data();
	}
}

function blockchair_eth_scan_data(data, setconfirmations, ccsymbol, latestblock) { // scan/poll
	if (data) {
		var transactiontime = (data.time) ? returntimestamp(data.time).getTime() : null;
		var ethvalue = (transactiontime) ? parseFloat((data.value / Math.pow(10, 18)).toFixed(8)) : null;
		var txhash = (data.transaction_hash) ? data.transaction_hash : null;
		var confirmations = (data.block_id && latestblock) ? latestblock - data.block_id : null;
		var recipient = (data.recipient) ? data.recipient : null;
		return {
			"ccval": ethvalue,
			"transactiontime": transactiontime,
			"txhash": txhash,
			"confirmations": confirmations,
			"setconfirmations": setconfirmations,
			"ccsymbol": ccsymbol,
			"recipient": recipient
		};
	}
	else {
		 return default_tx_data();
	}
}

function blockchair_erc20_scan_data(data, setconfirmations, ccsymbol, latestblock) { // scan
	if (data) {
		var transactiontime = (data.time) ? returntimestamp(data.time).getTime() : null;
		var erc20value = (data.value) ? parseFloat((data.value / Math.pow(10, data.token_decimals)).toFixed(8)) : null;
		var txhash = (data.transaction_hash) ? data.transaction_hash : null;
		var confirmations = (data.block_id && latestblock) ? latestblock - data.block_id : null;
		var recipient = (data.recipient) ? data.recipient : null;
		var token_symbol = (data.token_symbol) ? data.token_symbol : null;
		return {
			"ccval": erc20value,
			"transactiontime": transactiontime,
			"txhash": txhash,
			"confirmations": confirmations,
			"setconfirmations": setconfirmations,
			"ccsymbol": ccsymbol,
			"recipient": recipient,
			"token_symbol": token_symbol
		};
	}
	else {
		 return default_tx_data();
	}
}

function blockchair_erc20_poll_data(data, setconfirmations, ccsymbol, latestblock) { // poll
	if (data) {
		var transaction = data.transaction;
		var tokendata = data.layer_2.erc_20[0];
		if (transaction && tokendata) {
			var transactiontime = (transaction.time) ? returntimestamp(transaction.time).getTime() : null;
			var erc20value = (tokendata.value) ? parseFloat((tokendata.value / Math.pow(10, tokendata.token_decimals)).toFixed(8)) : null;
			var txhash = (transaction.hash) ? transaction.hash : null;
			var confirmations = (transaction.block_id && latestblock) ? latestblock - transaction.block_id : null;
			return {
				"ccval": erc20value,
				"transactiontime": transactiontime,
				"txhash": txhash,
				"confirmations": confirmations,
				"setconfirmations": setconfirmations,
				"ccsymbol": ccsymbol
			};
		}
		else {
			return default_tx_data();
		}
	}
	else {
		 return default_tx_data();
	}
}

function ethplorer_scan_data(data, setconfirmations, ccsymbol) { // scan
	if (data) {
		var transactiontime = (data.timestamp) ? data.timestamp * 1000 : null;
		var transactiontimeutc = (transactiontime) ? transactiontime + timezone : null;
		var erc20value = (data.value) ? parseFloat((data.value / Math.pow(10, data.tokenInfo.decimals)).toFixed(8)) : null;
		var txhash = (data.transactionHash) ? data.transactionHash : null;
		return {
			"ccval": erc20value,
			"transactiontime": transactiontimeutc,
			"txhash": txhash,
			"confirmations": false,
			"setconfirmations": setconfirmations,
			"ccsymbol": ccsymbol
		};
	}
	else {
		 return default_tx_data();
	}
}

function ethplorer_poll_data(data, setconfirmations, ccsymbol) { // poll
	if (data) {
		var transactiontime = (data.timestamp) ? (data.timestamp * 1000) + timezone : null;
		var txhash = (data.hash) ? data.hash : (data.transactionHash) ? data.transactionHash : null;
		var confirmations = (data.confirmations) ? data.confirmations : null;
		var operations = (data.operations) ? data.operations[0] : null;
		var tokenValue = (operations) ? operations.value : null;
		var tokenInfo = (operations) ? operations.tokenInfo : null;
		var decimals = (operations) ? tokenInfo.decimals : null;
		var ccval = (decimals) ? parseFloat((tokenValue / Math.pow(10, decimals)).toFixed(8)) : null;
		return {
			"ccval": ccval,
			"transactiontime": transactiontime,
			"txhash": txhash,
			"confirmations": confirmations,
			"setconfirmations": setconfirmations,
			"ccsymbol": ccsymbol
		};
	}
	else {
		 return default_tx_data();
	}
}

// RPC templates

function nano_scan_data(data, setconfirmations, ccsymbol, txhash) { // scan/poll
	if (data) {
		var ccval = (data.amount) ? parseFloat((data.amount / Math.pow(10, 30)).toFixed(8)) : null; // convert Mnano to nano
		var transactiontime = (data.local_timestamp) ? (data.local_timestamp * 1000) + timezone : null;
		var transactiontime_utc = (transactiontime) ? transactiontime : $.now() + timezone;
		var txhash = (data.hash) ? data.hash : (txhash) ? txhash : null;
		return {
			"ccval": ccval,
			"transactiontime": transactiontime_utc,
			"txhash": txhash,
			"confirmations": false,
			"setconfirmations": null,
			"ccsymbol": ccsymbol
		};
	}
	else {
		 return default_tx_data();
	}
}

function bitcoin_rpc_data(data, setconfirmations, ccsymbol, address) { // poll
	if (data) {
		var transactiontime = (data.time) ? (data.time * 1000) + timezone : null;
		var outputs = data.vout;
		if (outputs) {
			var outputsum = 0;
		    $.each(outputs, function(dat, value) {
				var satval = value.value * 100000000;
		        var output = (value.scriptPubKey.addresses[0] == address) ? Math.abs(satval) : 0;
		        outputsum += parseFloat(output) || 0; // sum of outputs
		    });
		}
	    var ccval = (outputs) ? outputsum / 100000000 : null;
	    var txhash = (data.txid) ? data.txid : null;
	    var confirmations = (data.confirmations) ? data.confirmations : null;
	    return {
			"ccval": ccval,
			"transactiontime": transactiontime,
			"txhash": txhash,
			"confirmations": confirmations,
			"setconfirmations": setconfirmations,
			"ccsymbol": ccsymbol
		};
	}
	else {
		 return default_tx_data();
	}
}

function amberdata_poll_data(data, setconfirmations, ccsymbol) { // poll (websocket)
	if (data) {
		var transactiontime = (data.timestamp) ? (data.timestamp) + timezone : null;
		var txhash = (data.hash) ? data.hash : null;
		var ccval = (data.value) ? parseFloat((data.value / Math.pow(10, 18)).toFixed(8)) : null;
		return {
			"ccval": ccval,
			"transactiontime": transactiontime,
			"txhash": txhash,
			"confirmations": null,
			"setconfirmations": setconfirmations,
			"ccsymbol": ccsymbol
		};
	}
	else {
		 return default_tx_data();
	}
}

function infura_eth_poll_data(data, setconfirmations, ccsymbol) { // poll
	if (data) {
		var transactiontime = (data.timestamp) ? (data.timestamp * 1000) + timezone : null;
		var ethvalue = (data.value) ? parseFloat((data.value / Math.pow(10, 18)).toFixed(8)) : null;
		var txhash = (data.hash) ? data.hash : null;
		var confirmations = (data.confirmations) ? data.confirmations : null;
		return {
			"ccval": ethvalue,
			"transactiontime": transactiontime,
			"txhash": txhash,
			"confirmations": confirmations,
			"setconfirmations": setconfirmations,
			"ccsymbol": ccsymbol
		};
	}
	else {
		 return default_tx_data();
	}
}

function infura_erc20_poll_data(data, setconfirmations, ccsymbol) { // poll
	if (data) {
		var tokenValue = (data.value) ? data.value : null;
		var decimals = (data.decimals) ? data.decimals : null;
		var ccval = (decimals) ? parseFloat((tokenValue / Math.pow(10, decimals)).toFixed(8)) : null;
		var transactiontime = (data.timestamp) ? (data.timestamp * 1000) + timezone : null;
		var txhash = (data.hash) ? data.hash : null;
		var confirmations = (data.confirmations) ? data.confirmations : null;
		return {
			"ccval": ccval,
			"transactiontime": transactiontime,
			"txhash": txhash,
			"confirmations": confirmations,
			"setconfirmations": setconfirmations,
			"ccsymbol": ccsymbol
		};
	}
	else {
		 return default_tx_data();
	}
}