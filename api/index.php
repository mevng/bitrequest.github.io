<?php
	
header("Content-Type: application/json");
	
include("keys.php");
include("api.php");

$postdata = $_POST;
$params = $postdata["params"];
$method = $params["method"];
$proxyheaders = $params["headers"];
$payload = $params["data"];

$rpc = $postdata["rpc"];
$custom = $postdata["custom"];
$apiname = $postdata["api"];
$apiurl = $postdata["api_url"];
$apikey = $postdata["api_key"];
$keyparam = $postdata["key_param"];
$ampersand = $postdata["ampersand"];
$search = $postdata["search"];
$nokey = $postdata["nokey"];
$auth_header = $postdata["auth_header"];
$bearer = $postdata["bearer"];
$cache_time = $postdata["cachetime"];
$cache_folder = $postdata["cachefolder"];

// Define data
$data_var = ($payload) ? $payload : null;

// Define key
$accestoken = $keys[$apiname];
$at_var = ($accestoken) ? $accestoken : null;
$auth_token = ($apikey) ? $apikey : $at_var;

// Construct headers
if (isset($proxyheaders) || $method == "POST" || $bearer) {
	$postheaders = array(
	    "Content-Type: application/json"
	);
	if (isset($payload)) {
		$postheaders[] = "Content-Length: " . strlen($payload);
	}
	foreach($proxyheaders as $key => $value) {
		$postheaders[] = $key . ": " . $value;
	}
}

// Add Authorization header if needed
if ($bearer && $auth_token) {
	$postheaders[] = "Authorization: Bearer " . $auth_token;
}

// Construct url
$key_param_var = ($accestoken) ? $ampersand . $keyparam . $accestoken : "";
$key_param = ($apikey || $nokey == "true") ? "" : $key_param_var;
$new_url = $apiurl . $key_param;

if ($custom) {
	if ($custom == "gk") {
		$key_array = base64_encode(json_encode(array(
		    "ad_id" => $keys["amberdata"],
		    "if_id" => $keys["infura"],
		    "ga_id" => $keys["googleauth"]
		)));
		echo json_encode(array(
		    "k" => $key_array
		));
	}
	else if ($custom == "nano_txd") {
		include("custom/rpcs/nano/index.php");
		echo nano($apiurl, $search, $data_var, $postheaders, $cache_time, $cache_folder);
	}
}
else {
	$result = api($new_url, $data_var, $postheaders, $cache_time, $cache_folder, true);
	echo $result;
}

// comment

?>