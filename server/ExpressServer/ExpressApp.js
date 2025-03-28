const cors = require("cors");
const session = require("express-session");
const crypto = require("crypto");
const path = require("path");
const bodyparser = require("body-parser");
const RedisClient = require("redisjson-express-session-store");
const nocache = require("nocache");
const FileUpload = require("express-fileupload");
require("dotenv").config();

const HomeRouter = require("./Routers/Home.js");
const AccountRouter = require("./Routers/Accounts.js");
const VideoRouter = require("./Routers/Video.js");

RedisClient.setClient(null, {
	url: `redis://localhost:${process.env.REDISPORT}`
});

const SessionMiddleWare = session({
	store: RedisClient.createJSONStore(),
	secret: crypto.randomBytes(32).toString("hex"),
	resave: false,
	saveUninitialized: true
});

const SaveNewSession = (req, res, next) => {
	if (!req.session.AccountInfo) {
		req.session.save(async () => {
			next();
		});
	} else {
		next();
	}
};

const ChangeUrl = (req, res, next) => {
	if (req.url.at(-1) !== "/" && req.method === "GET") {
		res.redirect(`${req.url}/`);
	} else {
		next();
	}
};

const ChangeIP = (req, res, next) => {
	let ip = req.ip;
	if (ip.startsWith("::ffff:")) {
		ip = ip.replace("::ffff:", "");
	}
	if (ip === "::1") {
		ip = "127.0.0.1";
	}
	req.clientIP = ip;
	next();
};

const awaitchanges = async (req, res, next) => {
	try {
		await RedisClient.inactiveSession(req.session);
		req.session.reload(() => {
			next();
		});
	} catch {
		console.warn("Request timed out.");
		const timeouterror = new Error("Timed Out Request");
		timeouterror.status = 408;
		next(timeouterror);
	}
};

const SetLoggedIn = async (req, res, next) => {
	if (!req.session.AccountInfo) {
		req.session.AccountInfo = {
			LoggedIn: false
		};
		// ! Change this for autolog in check
	}
	next();
};

function SetExpressRequests(express, app) {
	app.use(cors());
	app.use(nocache());
	app.use(
		express.static(path.join(__dirname, "..", "..", "client", "public"))
	);
	app.use(ChangeUrl);
	app.use(ChangeIP);
	app.use(SessionMiddleWare);
	app.use(SaveNewSession);
	app.use(awaitchanges);
	app.use(bodyparser.json());
	app.use(FileUpload());
	app.use(SetLoggedIn);
	app.use("/", HomeRouter);
	app.use("/account", AccountRouter);
	app.use("/video", VideoRouter);
	// 404 page
}

module.exports = {
	SetExpressRequests
};
