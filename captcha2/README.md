# Captcha2

*SPOILER WARNING!*

This is my solution to the Captcha 2 challenge on the wonderful hackers.gg CTF.
I was really surprised that this was only 100 points, as it required me to write 
a significant amount of code! I still think maybe there was something I'm missing. 


## Solving notes

1. When the page loads at hackers.gg:8765/


- maybe same svg draw call is used for each letter. not that many letters to try

captcha1.svg has "S" as char[0]
captcha3.svg has "S" as char[3]

