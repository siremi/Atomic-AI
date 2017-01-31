<?php
	session_start();
?>
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<title>AR OAuth Prototype</title>
</head>
<body>
<?php

if(!require_once "../ar_config.php")
	exit("Could not find configuration file!");

@include_once "../timer.php";

$requestArray = array();

// authenticate using OAuth2 and save the token in _SESSION
$oauth = new OAuth(CONSUMER_KEY, CONSUMER_SECRET, OAUTH_SIG_METHOD_HMACSHA1, OAUTH_AUTH_TYPE_URI);
$oauth->disableSSLChecks();
$oauth->enableDebug();

$reqTokenArray = array();
$accTokenArray = array();

// clear session for testing | you will need to handle expired tokens
//$_SESSION = array();

try
{
	if(isset($_SESSION["accTokenArray"]))
	{
		$accTokenArray = $_SESSION["accTokenArray"];
		echo "Re-using OAuth Token: \n<pre>",print_r($accTokenArray),"</pre>";
	}
	else
	{
		$reqTokenArray = $oauth->getRequestToken(API_HOST."/oauth/request-token");
		$oauth->setToken($reqTokenArray["oauth_token"], $reqTokenArray["oauth_token_secret"]);
		$oauth->getAccessToken(API_HOST."/oauth/authorize");
		$accTokenArray = $oauth->getAccessToken(API_HOST."/oauth/access-token");
		$_SESSION["accTokenArray"] = $accTokenArray;
	}

	$oauth->setToken($accTokenArray["oauth_token"], $accTokenArray["oauth_token_secret"]);

	$oauth->fetch(API_HOST."/account/data", $requestArray, "GET");
}
catch(OAuthException $ex)
{
	echo "<pre>",print_r($ex),"</pre>";
}

/*
echo "<pre>",print_r($reqTokenArray),"</pre>";
echo "<pre>",print_r($accTokenArray),"</pre>";
echo "<pre>",print_r($oauth->getLastResponse()),"</pre>";
*/

// prepare the data and make the API call

$text = "Once there was a Czar who had three lovely daughters. One day the three daughters went walking in the woods. They were enjoying themselves so much that they forgot the time and stayed too long. A dragon kidnapped the three daughters. As they were being dragged off they cried for help. Three heroes heard their cries and set off to rescue the daughters. The heroes came and fought the dragon and rescued the maidens. Then the heroes returned the daughters to their palace. When the Czar heard of the rescue, he rewarded the heroes.";

// add the text in a paragraph | this can be a partially written sentence / paragraph
$requestArray["content"] = $text;

// add optional 'contentHtml' param if you need to check links
$requestArray["contentHtml"] = $text." <a href='https://www.googlebroken.com'>broken link</a> <a href='http://www.atomicreach.com/blog/'>good link</a>";

$sophisticationBandIdsArray = array(
	"Genius"        => 1,
	"Academic"      => 2,
	"Specialist"    => 3,
	"Knowledgeable" => 4,
	"General"       => 5
);

// target audience level | 1,2,3,4,5 | optional | set to Knowledgeable by default
$requestArray["sophisticationBandId"] = $sophisticationBandIdsArray["Knowledgeable"];

$requestArray["serviceNamesArray"] = array(
	'paragraph_density', // return paragraphDensityArray
	'sentence_length',   // returns sentenceLengthIssuesArray
	'spelling',          // returns issuesArray
	'grammar',           // returns issuesArray
	'readability',       // calculates Syntax / audience level of the text | automatically done if context / synonyms are enabled
	'synonyms_v3',       // returns synonymsV3
	'context',           // orders synonymsV3 by context on top
	'urls'               // checks links in html | returns urlsArray
);

// encode the service names in a JSON string
$requestArray["serviceNamesArray"] = json_encode($requestArray["serviceNamesArray"]);

// API call
try
{
	$oauth->fetch(API_HOST."/analyze-text/master", $requestArray, "POST");
}
catch(OAuthException $ex)
{
	echo "<pre>",print_r($ex),"</pre>";
}

// read the response
echo "Reading response: \n<BR>";
$responseJsonStr = $oauth->getLastResponse();
$responseArray = json_decode($responseJsonStr, true);
echo "<pre>",print_r($responseArray),"</pre>";

// OR
// echo "<pre>",json_encode($responseJsonObj),"</pre>";

if(defined("START_TIME"))
	echo "\n\n<BR><BR>Time: ".number_format(getmicrotime()-$startTime,4)." seconds";

?>
</body>
</html>


