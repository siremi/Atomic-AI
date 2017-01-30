<?php

function getmicrotime()
{
	list($usec, $sec) = explode(" ",microtime());
	return ((float)$usec + (float)$sec);
}

// script timer
$startTime = getmicrotime();

define("START_TIME", $startTime);