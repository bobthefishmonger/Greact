const express = require("express");
const path = require("path");

const Router = express.Router();

function sendHTML(res, File) {
	res.sendFile(
		path.join(__dirname, "..", "..", "..", "client", `${File}.html`)
	);
}

Router.get("/", (req, res) => {
	sendHTML(res, "Home");
	return true;
});

module.exports = Router;
