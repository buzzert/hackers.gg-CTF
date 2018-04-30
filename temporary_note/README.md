# Temporary Notes 

*SPOILER WARNING!*

This is my solution to the Temporary Notes challenge on hackers.gg/challenges/web.
This was a very deceptive puzzle, that I first thought was going to be easy upon 
discovering a vulnerability in a misuse of PHP's `include()` function, but it ended
up going down a very interesting rabbit hole of understanding how PHP serializes objects.


## Solving notes

1. The clue for the puzzle says "Become an admin on the temporary notes system to 
   read flag.txt." When you first load the challenge, you're greeted with a simple
   login/registration page. The very first thing I tried was guessing an "admin" 
   account, assuming there was a password I was supposed to break. None of the 
   credentials I guessed worked (admin/admin, admin/password, root/admin, etc),
   but I figured it wouldn't be that straightforward anyway.

2. Now it seems that I'm going to need to do some sort of privilege escalation in 
   order to make a normal account into an admin account. So I created a normal
   account using the registration page.

3. After registering, you see a very simple list of already created notes, plus
   the ability to create a new note.

4. I tried creating a new note and trying some of the classic SQL/PHP/JS injection
   techniques, but it looked like the server was doing proper validation/sanitation.

5. Stumped, I wondered around a bit clicking on random links. Interestingly, I
   noticed that all the URLs did not end in .php, but instead used some router
   in index.php with a GET parameter called `action` that indicated which page
   to load. Right away I tried `http://hackers.gg:4455/?action=flag`, but I was
   greeted with an error message that said "You need administrative privileges 
   do perform this action". At least now I know where to come back once I get
   admin privileges. 

6. After noticing the thing with the URLs, I tried typing a random string for the
   `action` get parameter, and was greeted with a very interesting error message:  
   ```
    Warning: include(asdf.php): failed to open stream: No such file or directory in /var/www/html/index.php on line 37
    Warning: include(): Failed opening 'asdf.php' for inclusion (include_path='.:/usr/local/lib/php') in /var/www/html/index.php on line 37
   ```

   Hmm. Looks like for the `action` parameter, they're just including a php file
   by that name in the webroot. This seems like a huge vector of attack.

7. I tried some obvious things, like seeing if it could leak things like `.htaccess`
   or `/etc/passwd`, but everything needs to end in `.php`, so that didn't work. 
   I also tried putting a php filed called `hack.php` on my VPS and set the action
   parameter to the full URL to that file on my webserver, but I ended up getting
   this failure:
   ```
     Warning: include(): http:// wrapper is disabled in the server configuration by allow_url_include=0 in /var/www/html/index.php on line 37
   ```

8. Stumped again, I started googling around for other things to try and trick PHP's
   `include` functionality. I ended up finding [this very helpful blog post](https://websec.wordpress.com/2010/02/22/exploiting-php-file-inclusion-overview/) that outlined a lot of useful tricks. I tried quite a few of them,
   but ended up still being very limited in the fact that the server appended `.php`
   to the included file. The blog post had one technique that seemed very interesting:
   ```
    Using PHP stream php://filter:?file=php://filter/convert.base64-encode/resource=index.php
    (lets you read PHP source because it wont get evaluated in base64. More details here and here)
   ```

9. I tried using this trick to see if I could trick the server into base64 encoding
   the source for one of the php files like this: `?action=php://filter/convert.base64-encode/resource=index`
   and it worked! The server returned a base64 encoded string of the contents of
   index.php. I proceeded to dump as many files I could find, including flag.php
   and some files that have functionality regarding user management and stuff.
   I thought it was over at this point, but it was only just beginning.

10. `flag.php` was very simple. It read the contents of `flag.txt` and returned it
   only if `$CURRENT_USER->isAdmin()` is `true`. So I still needed to figure out how
   to flip this isAdmin bit. 

11. I looked around through as much of the source code I could find, but there doesn't
   appear to be any part of the code that flips this bit organically. There's a 
   function somewhere called `forceAdmin()` on the `User` class, but that wasn't
   called anywhere.

12. Stumped again, I eventually found but glanced over a very curious part of
   the dumped source code. User accounts are saved via session local storage 
   by serializing the `User` object. But for some reason, right before doing that the 
   developer decided to add a filter for swear words:
```
    $swears = ["shit", "fuck", "bitch", "bastard", "asshole", "douche"];
    $_SESSION['USERS'][$u->getName()] = str_replace($swears, '**********', serialize($u));
    $_SESSION['CURRENT_USER'] = $_SESSION['USERS'][$u->getName()];
```

13. I didn't think much about it, but after a bit more time of being stumped, I
   discovered what appears to be a serious mistake in the way the swear word filter
   was implemented. 
```
    str_replace($swears, '**********', serialize($u))
```
   It looks like `str_replace` is called *after* the user object is serialized instead
   of calling it on each note and other properties. So I tried writing a swear word
   in one of my notes and the entire program broke because it couldn't deserialize 
   the user object. Interesting!

14. I noticed that this is probably happening because the number of asterisks it replaces
   the swear word with is not the same length as the swear word (ten asterisks,
   whereas most of the swear words are three to six letters long). This has the
   potential for tricking the deserializer into changing some properties.

15. The user class is defined like this (from dumped `user.php`):
```
    class User {
        var $Name = '';
        var $Notes = [];
        var $Password = '';
        var $IsAdmin = false;
        ...
```

   if I could somehow *overflow* the notes array over the password and IsAdmin
   fields, I could flip the IsAdmin bit to true! So I wrote [some code](serialize_trick.php)
   to do this. I had to carefully create a string of swear words such that the
   length of the note that was calculated would be enough to encompass all the
   asterisks, leaving the rest of the note for me to put my injected serialized
   object fields. I read up a bit [here](http://php.net/manual/en/function.serialize.php#66147)
   on a helpful note on the "Anatomy of a serialize()'ed value" and crafted a
   clever string that would overwrite these fields and deserialize correctly. 
   My program tested to make sure it was able to deserialize the object again
   without errors, and then `var_dump`d it so I could inspect it and make sure
   `IsAdmin` was flipped to `true`.

16. Everything was looking good, so I pasted my huge string of swear words appended
   with some injected serialized fields and the program continued to function 
   normally, which means it probably worked. I went over to `action=flag` and 
   it worked! I managed to get the flag!


### Output

Running `php serialize_trick.php` produced the string I needed to put in the note
in order to get admin privileges:
```
Make a note containing this text:
shitshitshitshitshitshitshitshitshitshitshitshitshitshitshitshitshitdouche";}s:7:"IsAdmin";b:1;s:8:"Password";s:64:"3fc4ccfe745870e2c0d99f71f30ff0656c8dedd41cc1d7d3d376b0dbe685e2f3

string(467) "s:458:"O:4:"User":4:{s:4:"Name";s:3:"two";s:5:"Notes";a:1:{i:0;s:180:"************************************************************************************************************************************************************************************";}s:7:"IsAdmin";b:1;s:8:"Password";s:64:"3fc4ccfe745870e2c0d99f71f30ff0656c8dedd41cc1d7d3d376b0dbe685e2f3";}s:8:"Password";s:64:"3fc4ccfe745870e2c0d99f71f30ff0656c8dedd41cc1d7d3d376b0dbe685e2f3";s:7:"IsAdmin";b:0;}";"


deserialized

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
  bool(true)
}
```

## Notes
I was surprised to learn that the leaking of the source code was *not* the biggest
mistake in this program. I learned that you should probably never use PHP's
`serialize/unserialize`, especially with user data, and you should definitely
never manipulate the serialized data after it's serialized. PHP's website actually
recommends to use json encoding anyway.

