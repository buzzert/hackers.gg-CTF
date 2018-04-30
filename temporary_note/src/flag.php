<?php
	// Dumped from the include() vulnerability
	
	if(strtolower($_SERVER['SCRIPT_NAME'])!='/index.php') die();
	if($CURRENT_USER->isAdmin()) echo file_get_contents('flag.txt');
?>