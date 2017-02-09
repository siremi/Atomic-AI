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

if(!require_once "lib/ARClient.php")
	exit("Could not find ARClient file!");

@include_once "../timer.php";

$atomic_reach = new AR_Client(API_HOST,CONSUMER_KEY,CONSUMER_SECRET);
$atomic_reach->init();
$atomic_reach->setDebugMode(true);
$atomic_reach->setAppName("TEST");

$requestArray = array();

// prepare the data and make the API call

$text = "Once there was a Czar who had three lovely daughters. One day the three daughters went walking in the woods. They were enjoying themselves so much that they forgot the time and stayed too long. A dragon kidnapped the three daughters. As they were being dragged off they cried for help. Three heroes heard their cries and set off to rescue the daughters. The heroes came and fought the dragon and rescued the maidens. Then the heroes returned the daughters to their palace. When the Czar heard of the rescue, he rewarded the heroes.";

// add the text in a paragraph | this can be a partially written sentence / paragraph
$requestArray["content"] = $text;

// add optional 'contentHtml' param if you need to check links
$requestArray["contentHtml"] = $text." <a href='https://www.googlebroken.com'>broken link</a> <a href='http://www.atomicreach.com/blog/'>good link</a>";

// target audience level | 1,2,3,4,5 | optional | set to Knowledgeable by default
$requestArray["sophisticationBandId"] = $atomic_reach->sophisticationBandIdsArray["Knowledgeable"];

$requestArray["serviceNamesArray"] = array(
	'paragraph_density', // return paragraphDensityArray
	'sentence_length',   // returns sentenceLengthIssuesArray
	'spelling',          // returns issuesArray
	'grammar',           // returns issuesArray
	'readability',       // calculates Syntax / audience level of the text | automatically done if context / synonyms are enabled
	'synonyms_v3',       // returns synonymsV3 by Context / best match on top
	"keywords",          // returns keywordsArray
	'urls'               // checks links in html | returns urlsArray
);

// API call
$responseJsonObj = $atomic_reach->analyzeText($requestArray);

// read the response
echo "Reading response: \n<BR>";
echo "<pre>",print_r($responseJsonObj),"</pre>";

// OR
// echo "<pre>",json_encode($responseJsonObj),"</pre>";

if(defined("START_TIME"))
	echo "\n\n<BR><BR>Time: ".number_format(getmicrotime()-$startTime,4)." seconds";

?>
</body>
</html>


