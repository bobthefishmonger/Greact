const express = require("express");
const app = express();
const http = require("http").Server(app);
require("dotenv").config;

const ExpressApp = require("./ExpressServer/ExpressApp.js").SetExpressRequests(
	express,
	app
);

http.listen(process.env.PORT, () => {
	console.log(`Listening on port: ${process.env.PORT}`);
});
