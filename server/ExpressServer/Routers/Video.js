const express = require("express");
const VideoManager = require("../../Management/Video.js");
const Router = express.Router();

Router.post("/uploadvideo", (req, res) => {
	VideoManager.RouterUploadVideo(req, res);
});
Router.get("/getvideo", async (req, res) => {
	await VideoManager.RouterSendVideo(req, res);
});

Router.get("/getvideo/Chunks/:date/:name/Chunks/:segment", async (req, res) => {
	await VideoManager.RouterSendChunk(req, res);
});

module.exports = Router;
