const express = require("express");
const path = require("path");
const AccountsManager = require("../../Management/Accounts.js");

const Router = express.Router();

function sendHTML(res, File) {
	res.sendFile(
		path.join(__dirname, "..", "..", "..", "client", `${File}.html`)
	);
}

Router.get("/", (req, res) => {
	sendHTML(res, "Account");
	return true;
});

Router.get("/signup", (req, res) => {
	sendHTML(res, "Signup");
	return true;
});
Router.get("/login", (req, res) => {
	sendHTML(res, "Login");
	return true;
});

Router.post("/signup", async (req, res) => {
	console.log(req.body);
	const { Username, Password, Email, PhoneNumber, DOB } = req.body;
	await AccountsManager.SignUp(
		req,
		res,
		Username,
		Password,
		Email,
		PhoneNumber,
		DOB
	);
	return true;
});
Router.get("/signup/aboutyou", (req, res) => {
	sendHTML(res, "AboutYou");
	return true;
});
Router.post("/signup/aboutyou", async (req, res) => {
	const { Interests, ProfileImage, Bio } = req.body;
	const id = req.query.id;
	await AccountsManager.SignUpExtras(req, res, Interests, ProfileImage, Bio);
	return true;
});

Router.post("/login", async (req, res) => {
	const { Username, Password } = req.body;
	return true;
});

module.exports = Router;
