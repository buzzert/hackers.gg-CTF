<?php
	// Dumped from the include() vulnerability 

	function saveCurrentUser() {
		$u = $GLOBALS['CURRENT_USER'];
		if(!$u) return;
		$swears = ["shit", "fuck", "bitch", "bastard", "asshole", "douche"];
		$_SESSION['USERS'][$u->getName()] = str_replace($swears, '**********', serialize($u));
		$_SESSION['CURRENT_USER'] = $_SESSION['USERS'][$u->getName()];
	}

?>