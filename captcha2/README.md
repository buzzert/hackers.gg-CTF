# Captcha2

*SPOILER WARNING!*

This is my solution to the Captcha 2 challenge on the wonderful hackers.gg CTF.
I was really surprised that this was only 100 points, as it required me to write 
a significant amount of code! I still think maybe there was something I'm missing. 


## Solving notes

1. When the page loads at hackers.gg:8765, the only thing that's visible is the
   captcha, a text field, submit button, and some text that says "You have 1000ms to
   solve the captcha". Naturally, my first attempt at solving this puzzle was to see
   how fast I can humanly solve the captcha and attempt to do it in under a second.

2. I soon realized that it's *definitely* not possible for a human to do this in
   under a second, so either the puzzle maker wants people to write a program to 
   do this, or there's some information leaked somewhere. Writing a program to solve
   this seemed very time consuming, so the first thing I did was look for information
   leaks.

3. The first place I looked for leaks is in my browser's local storage and the site's
   cookies. The only thing I found in there was your pretty standard web server
   session id token:  
   ```
        PHPSESSID : [some random UUID]
        server-session-cookie-id : [some random UUID]
        session : [some random UUID]
   ```

4. After staring at this for a bit, I found that there is no way to derive the
   captcha from this information. Next, I tried to look at the image it generated
   for the captcha.

5. It turns out, the image it's generating is actually an SVG... interesting. There
   was nothing identifying in the SVG itself about what characters are contained
   (i.e., nothing in the comments, no attributes for each letter, etc). Just pure
   draw commands. 

6. While it was disappointing that I didn't find any evidence of information leaks,
   it does look like it's going to be easier to write a program to do some kind of 
   recognition on an SVG rather than a bitmap image, so I started looking at patterns
   in the SVG.

7. When I started looking for patterns in the SVG, I tried to see if the draw commands
   were the same for every letter it draws (i.e., does an "S" in one captcha have the
   same draw commands as an "S" in another captcha).

8. It looks like that's not the case, the puzzle maker decided to use absolute SVG
   draw commands (indicated by capital letters "M" for move "L" for lineto as 
   opposed to "l" for relative lineto and "m" for relative move).

9. At first I thought I'd have to do quite a bit of arithmetic to match patterns
   of SVG draw commands to letters, but then I realized that because the letters 
   were rather complicated, there were quite a few draw commands for each letter.
   I figured I could just distill each letter in the SVG down to it's draw commands
   and skip the actual coordinates and that might be good enough to pattern match
   against a table of known drawing patterns to letters.

10. I had the server generate a few more captchas and I saved all the results to
   my local machine (seen in `svgs` in this repository). I tried to see if this 
   approach would work, so I wrote a program to take an SVG in, and return
   these distilled draw commands out.

11. Turns out, another challenge of the puzzle is that the letters are drawn in a 
   seemingly random order. I had to modify my program so that it sorts the letters
   based on the first `move` draw call's coordinates before inspecting the results
   and comparing them to the table.

12. This showed really promising results, so I started adding more letters to the 
   table by hand. I was going to write a "training" program so I could just sit
   and solve captchas by hand until the table was filled with every letter (it
   would've been 26 * 2 + 9 entries in the table--capital and lowercase letters
   plus numbers). But I realized that after filling out only about 20 entries or
   so, that might be enough to get one of the captchas right by chance if I run
   my program a few times.

13. Turns out that was true! I did not have to fill out the entire table to get
   the flag. Great success!


## Running it

1. Install package dependencies by running `npm install`
2. Run `node main`

### Output

The output will be the letters the program read and their corresponding signatures,
it's best guess for each letter using the table in captcha_table.js, and finally 
the response from the server after submitting the request.

	"MLLQLLQLLQLLQLLLQLLQLLQLLQLLQLLQLLQLLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQZMLLQLLQLLQLLQLLQLLLLQLLQLLQLLQLLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQLLLLQLLQLLQLLQLLQLLQLLLLQLLQLLQLLQLLQLLQLLLLLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQ" : "3",
	"MLLQLLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQZMLLQLLQLLQLLQLLQLLLQLLQLLQLLQLLQLLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQLLLQLLQLLQLLQLLQ" : "M",
	"MLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQLLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQZMLLQLLQLLQLLQLLQLLQLLQLLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQLLLQLLQLLQLLQLLQLLLQLLQLLLQLLQLLQLLQLLQLLQLLLQLLQLLQLLQLLLQLLQZMLLL" : "m",
	"MLLQLLQLLQLLQLLQLLQLLQLLQZMLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQZMLLQLLQLLQLLLQLLQLLLQLLQLLQLLQLLQLLQLLQLLQLLQLLQZMLLQLLQLLQLLQLLQLLQLLQ" : "D",

	GUESS: 3MmD
	FLAG: <h1>FLAG{[REDACTED]}</h1>



## Notes

This was the first time I've ever written in Node.js. I normally would not have
chosen JavaScript, but at first I thought I was going to have to write a
greasemonkey script that I'd then have to inject into the browser to solve this
captcha and get the flag. I didn't realize that the program would not involve a 
web browser anyway, and would be doing everything via HTTP GET requests. Oh well!


