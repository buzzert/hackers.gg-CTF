/*
 * captcha.js 
 * 
 * Code for solving the "Captcha 2" challenge on http://hackers.gg/challenges/web
 * Implements the strategy of using a handmade table of SVG character "signatures" (i.e., distilled 
 * draw calls) to ASCII characters.
 *
 * Author: buzzert <buzzert@buzzert.net>
 */

const http = require("http");
const DOMParser = require("domparser").DOMParser;
const SVGEncodedLetterTable = require("./captcha_table.js");

module.exports = class CaptchaSolver {
	constructor() {
		this.cookieData = null;
	}

	async downloadSVGData(url) {
		return new Promise((resolve, reject) => {
			http.get(url, (response) => {
				let responseData = "";
				response.on("data", (chunk) => {
					responseData += chunk;
				});

				response.on("end", () => {
					// Save this cookie, and make sure to send back when we make a submitCaptcha request.
					// This is how the server keeps track of sessions <-> captchas.
					this.cookieData = response.headers["set-cookie"];
					resolve(responseData);
				});
			}).on("error", (err) => {
				reject(err.message);
			});
		});
	}

	parseSVGDataToCommands(svgData) {
		var parser = new DOMParser();
		var xmlDoc = parser.parseFromString(svgData);

		var pathIndex = 0;
		var pathNodes = xmlDoc.getElementsByTagName("path");
		var encodedPathDicts = [];
		for (var i = 0; i < pathNodes.length; i++) {
			var node = pathNodes[i];
			var pathData = node.getAttribute("d");
			var fillColor = node.getAttribute("fill");
			if (fillColor == "none") {
				// This is one of those scribbly lines
				continue;
			}

			// Parse path data
			var commands = [];
			var accumulator = "";
			var currentCommand = "";
			var currentXCoord = "";
			var currentYCoord = "";
			for (var j = 0; j < pathData.length; j++) {
				var chr = pathData.charAt(j);		
				var chrCode = pathData.charCodeAt(j);

				// Draw commands
				if (chrCode > 64 && chrCode < 91) {
					// A-Z - draw commands
					if (currentCommand != "") {
						currentYCoord = accumulator;
						accumulator = "";

						commands.push({
							command : currentCommand,
							x : parseFloat(currentXCoord),
							y : parseFloat(currentYCoord)
						});
					}

					currentCommand = chr;
				} else if (chr == " ") {
					// space - separates x and y
					currentXCoord = accumulator;
					accumulator = "";
				} else {
					accumulator += chr;
				}
			}

			var encoding = "";
			var firstMoveCommand = null;
			for (var j = 0; j < commands.length; j++) {
				var command = commands[j];
				if (command.command == "M" && firstMoveCommand == null) {
					firstMoveCommand = command;
				}

				// This was really simple but ended up being good enough.
				// The "encoding" is really just all the SVG draw commands strung together.
				encoding += command.command;
			}

			encodedPathDicts.push({
				xPos : firstMoveCommand.x,
				encoding : encoding
			});
		}

		// Sort these now by move commands
		encodedPathDicts.sort(function(a, b) { return a.xPos - b.xPos });
		return encodedPathDicts.map(path => path.encoding);
	}

	makeGuessFromSignatureTable(encodedPaths) {
		var result = "";
		for (var i = 0; i < encodedPaths.length; i++) {
			var encoding = encodedPaths[i];

			var guess = "?";
			if (encoding in SVGEncodedLetterTable) {
				guess = SVGEncodedLetterTable[encoding];
			}

			result += guess;

			// Log the guesses in a format that's easy to put back into the table
			console.log("\"" + encoding + "\" : \"" + guess + "\",");
		}

		console.log("\nGUESS: " + result);
		return result;
	}

	async submitCaptcha(guess) {
		let parent = this; // js is stupid
		return new Promise(function(resolve, reject) {
			http.get({
				hostname : "hackers.gg",
				port : 8765,
				path : "/captcha_submit?answer=" + guess,
				headers : {
					"Cookie" : parent.cookieData
				},
			}, (res) => {
				let data = '';
				res.on('data', (chunk) => {
					data += chunk;
				});

				res.on('end', () => {
					resolve(data);
				});
			}).on('error', (err) => {
				console.log("error: " + err);
				reject(err);
			});
		});
	}
}

