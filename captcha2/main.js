/*
 * main.js 
 * 
 * Code for solving the "Captcha 2" challenge on http://hackers.gg/challenges/web
 * Implements the strategy of using a handmade table of SVG character "signatures" (i.e., distilled 
 * draw calls) to ASCII characters.
 *
 * Author: buzzert <buzzert@buzzert.net>
 */

const CaptchaSolver = require("./captcha.js");

let solver = new CaptchaSolver();
solver.downloadSVGData("http://hackers.gg:8765/captcha").then(result => {
	let encodedPaths = solver.parseSVGDataToCommands(result);
	let guess = solver.makeGuessFromSignatureTable(encodedPaths);

	if (!guess.includes("?")) { // means we have a solid guess
		solver.submitCaptcha(guess).then(flag => {
			console.log("FLAG: " + flag);
		});
	} else {
		console.log("Error: spotty captcha table, did not submit guess with ?'s");
			// TODO: We could loop this until we find a solution, or stop being lazy and actually
			// write a "trainer" program that shows the user captchas, has them type in the string
			// until the table is complete.
	}
})