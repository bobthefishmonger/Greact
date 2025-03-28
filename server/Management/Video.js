const RedisClient = require("redisjson-express-session-store");
const path = require("path");
const childprocesses = require("child_process");
const crypto = require("crypto");
const fs = require("fs");
const db = require("./dbManager.js");

function MakeChunks(Name) {
	const CurrentDate = new Date();
	const Year = CurrentDate.getFullYear();
	const Month = String(CurrentDate.getMonth() + 1).padStart(2, "0");
	const Day = String(CurrentDate.getDate()).padStart(2, "0");
	const IDName = crypto.randomUUID();
	const UploadDate = `${Year}-${Month}-${Day}`;
	const UploadPath = path.join(
		__dirname,
		"..",
		"Database",
		"Uploads",
		"Videos",
		UploadDate,
		IDName
	);
	const ChunkPath = path.join(UploadPath, "Chunks");
	if (!fs.existsSync(ChunkPath)) {
		fs.mkdirSync(ChunkPath, { recursive: true }, (err) => {
			if (err) {
				console.error(err);
				return false;
			}
		});
	}
	const TempPath = path.join(
		__dirname,
		"..",
		"Database",
		"Uploads",
		"Videos",
		"temp",
		Name
	);
	childprocesses.exec(
		`ffmpeg \
    -i "${TempPath}" \
    -preset fast \
    -hls_time 6 \
    -hls_list_size 0 \
    -codec:a aac \
    -hls_segment_filename "${ChunkPath}/segment_%03d.ts" \
    -hls_base_url "./Chunks/${UploadDate}/${IDName}/Chunks/" \
    -f hls \
    "${UploadPath}/${IDName}.m3u8"
    `,
		async (err) => {
			if (err) {
				console.error(err);
			}
			fs.unlinkSync(`${TempPath}`);
			try {
				await db.WriteVideo(IDName, UploadDate);
			} catch (err) {
				console.error(err);
				return false;
			}
			return true;
		}
	);
	return true;
}

function RouterUploadVideo(req, res) {
	if (!req.files || Object.keys(req.files).length === 0) {
		res.json({ success: false, message: "No File Uploaded" });
		return false;
	}
	const MimeTypes = [
		"video/mp4",
		"video/mpeg",
		"video/x-matroska",
		"video/webm",
		"video/ogg",
		"video/x-msvide",
		"video/mp2t",
		"video/3gpp",
		"video/3gpp2"
	];
	if (!MimeTypes.includes(req.files.Upload.mimetype)) {
		res.json({
			success: false,
			message: "Invalid file type. Only video files are allowed."
		});
		return false;
	}
	const TempPath = path.join(
		__dirname,
		"..",
		"Database",
		"Uploads",
		"Videos",
		"temp",
		req.files.Upload.name
	);

	req.files.Upload.mv(TempPath, async (err) => {
		if (err) {
			console.log(err);
			res.json({ success: false, message: "A Server Error Occured" });
			return false;
		} else {
			res.json({ success: true, message: "Uploaded" });
			MakeChunks(req.files.Upload.name);
		}
	});
	return true;
}

async function RouterSendVideo(req, res) {
	const VideoID = Math.floor(Math.random() * (await db.GetMaxID()) + 1); // ! This is where you use params, instead of a bad sql
	try {
		const VideoInfo = await db.GetVideoInfo(VideoID);
		// const VideoInfo = await db.GetVideoInfo(6); // // ! Change this back
		res.sendFile(
			path.join(
				__dirname,
				"..",
				"Database",
				"Uploads",
				"Videos",
				VideoInfo.UploadDate,
				VideoInfo.Name,
				`${VideoInfo.Name}.m3u8`
			)
		);
		return true;
	} catch (err) {
		res.status(500).send("An Error Occured");
		return false;
	}
}

async function RouterSendChunk(req, res) {
	const ChunkPath = path.join(
		__dirname,
		"..",
		"Database",
		"Uploads",
		"Videos",
		req.params.date,
		req.params.name,
		"Chunks",
		req.params.segment
	);
	if (!fs.existsSync(ChunkPath)) {
		res.status(404).send("Cannot find chunk");
		return;
	}
	res.sendFile(ChunkPath);
	return true;
}

module.exports = {
	MakeChunks,
	RouterUploadVideo,
	RouterSendVideo,
	RouterSendChunk
};
