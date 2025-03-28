// TODO-JEDD: Changes the limits to suit needs
const VIDEOCACHELIMIT = 15;
const CLEANUPAMOUNT = 10;

const CachedChunkNames = [];
const CachedChunksURLs = {};

let CachedVideoHistory = [];
let CachedVideosURLs = [];

let HistoryVideo = false;
let HistoryIndex = -1;
let CurrentVideo;

// TODO-JEDD: HTML/Whatever main structure you use
// 	<script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
// before this file, else there should be an npm install and import
// This is my structure for the upluading
/*
	<form id="VideoUpload">
		<input id="UploadInput" type="file" name="Upload" /> <-- The name="Upload" is necessary on the input
	<input type="submit" />
</form>*/

// TODO-JEDD: Toggle for history + history index
// History index should be -ve
// If it exceeds the length of the history, it will start loading new videos (not reset history index tho)[see note]

async function CacheCleaner() {
	while (true) {
		if (CachedVideoHistory.length > VIDEOCACHELIMIT) {
			for (let i = 0; i < CLEANUPAMOUNT; i++) {
				const Url = CachedVideoHistory[i];
				URL.revokeObjectURL(Url);
				if (CachedChunksURLs[Url]) {
					CachedChunksURLs[Url].forEach((_Url) => {
						URL.revokeObjectURL(_Url);
					});
					delete CachedChunksURLs[Url];
				}
			}
			CachedVideoHistory = CachedVideoHistory.slice(CLEANUPAMOUNT);
		}
		await new Promise((resolve) => setTimeout(resolve, 5000)); // TODO-JEDD: Change this timeout to suit needs, idrk
	}
}

async function BackgroundLoader() {
	while (true) {
		if (CachedVideosURLs.length < 3) {
			// TODO-JEDD: If you want more than minimum 3 videos caching/cached then change this
			try {
				await VideoCache();
			} catch (err) {}
		}
		await new Promise((resolve) => setTimeout(resolve, 2000)); // TODO-JEDD: same for this timeout
	}
}

async function VideoCache() {
	//fetches 5 .m3u8 first
	const VideoRequests = [];
	const Offset = CachedVideosURLs.length;
	for (let i = 0; i < 5; i++) {
		VideoRequests.push(
			fetch("/video/getvideo")
				.then(async (Video) => {
					const Video_COPY = Video.clone();
					const VideoBlob = await Video.blob();
					const VideoText = await Video_COPY.text();
					const VideoURL = URL.createObjectURL(VideoBlob);
					CachedChunkNames[Offset + i] = [];
					for (const line of VideoText.split("\n")) {
						if (!line || line.startsWith("#EXT")) continue;
						CachedChunkNames[Offset + i].push(line.trim());
					}
					return VideoURL;
				})
				.catch((err) => {
					return null;
				})
		);
	}
	CachedVideosURLs.push(...(await Promise.all(VideoRequests)));

	//fetches first chunk of each video (to optimise fast scrolling)
	const ChunkRequests = [];
	for (let i = 0; i < 5; i++) {
		ChunkRequests.push(
			fetch(`/video/getvideo/${CachedChunkNames[Offset + i][0]}`)
				.then(async (Chunk) => {
					const ChunkBlob = await Chunk.blob();
					const ChunkURL = URL.createObjectURL(ChunkBlob);
					CachedChunksURLs[CachedVideosURLs[Offset + i]] = [ChunkURL];
					return ChunkURL;
				})
				.catch((err) => {
					return null;
				})
		);
	}
	await Promise.all(ChunkRequests);
	//will then load any remaining chunks, until all 5 videos are fully loaded
	const ExtraChunkRequests = [];
	for (let i = 0; i < 5; i++) {
		const ExtraChunks = CachedChunkNames[Offset + i];
		CachedChunksURLs[CachedVideosURLs[Offset + i]].push(
			...new Array(ExtraChunks.length - 1).fill(null)
		);
		for (let j = 1; j < ExtraChunks.length; j++) {
			ExtraChunkRequests.push(
				fetch(`/video/getvideo/${ExtraChunks[j]}`)
					.then(async (Chunk) => {
						const ChunkBlob = await Chunk.blob();
						const ChunkURL = URL.createObjectURL(ChunkBlob);
						CachedChunksURLs[CachedVideosURLs[Offset + i]][j] =
							ChunkURL;
						return ChunkURL;
					})
					.catch((err) => {
						return null;
					})
			);
		}
	}
	await Promise.all(ExtraChunkRequests);
}

class CacheLoader extends Hls.DefaultConfig.loader {
	constructor(config) {
		super(config);
	}

	async load(context, config, callbacks) {
		if (context.frag) {
			// context.frag checks if it is a ts (true) or m3u8 (false)
			const VideoKey = CurrentVideo;
			if (VideoKey && CachedChunksURLs[VideoKey]) {
				const ChunkURL = CachedChunksURLs[VideoKey][0];
				CachedChunksURLs[VideoKey] =
					CachedChunksURLs[VideoKey].slice(1);
				if (ChunkURL) {
					context.url = ChunkURL;
				} else {
					context.url =
						window.location.origin +
						"/video/getvideo" +
						context.frag.relurl.slice(1);
				}
			} else {
				context.url =
					window.location.origin +
					"/video/getvideo" +
					context.frag.relurl.slice(1); // Default GET path for any requests for a chunk
			}
		} else {
			if (HistoryVideo) {
				const VideoURL = CachedVideoHistory.at(HistoryIndex);
				if (VideoURL) {
					CurrentVideo = VideoURL;
					context.url = VideoURL;
				} else {
					CurrentVideo = context.url;
				}
			} else {
				/// TODO-JEDD: If you want the History index to reset oe, heres where
				const VideoURL = CachedVideosURLs[0];
				CachedVideosURLs = CachedVideosURLs.slice(1);
				if (VideoURL) {
					CurrentVideo = VideoURL;
					CachedVideoHistory.push(VideoURL);
					context.url = VideoURL;
				} else {
					CurrentVideo = context.url;
					CachedVideoHistory.push(context.url);
				}
			}
		}
		super.load(context, config, callbacks);
	}
}

async function FetchVideo() {
	hls.loadSource(window.location.origin + "/video/getvideo"); // The url isn't really important, just needs a string there
	hls.attachMedia(document.getElementById("testvid")); // TODO-JEDD: Where the video info is set to your vid
	// document.getElementById("testvid").play();
	return true;
}

async function UploadVideo() {
	alert("uploading");
	const VideoForm = new FormData();
	VideoForm.append("Upload", document.getElementById("UploadInput").files[0]);
	// TODO-JEDD: Feel free to add some compression on this side / max length
	// It will be done server side too (for validation ect), but compressing and max length will make uploading easier,
	// and mean longer videos can be uploaded
	let Response = await fetch("/video/uploadvideo", {
		method: "POST",
		body: VideoForm
	});
	Response = await Response.json();
	if (!Response.success) {
		console.warn(Response.message);
		alert("didnt work", Response.message);
	} else {
		alert("uploaded");
	}
	return true;
}

// TODO-JEDD: Replace these with ur acc listeners ect

document.getElementById("VideoUpload").addEventListener("submit", async (e) => {
	e.preventDefault();
	await UploadVideo();
});

document.getElementById("GetVideoBtn").addEventListener("click", async (e) => {
	e.preventDefault();
	await FetchVideo();
});

BackgroundLoader();
CacheCleaner();
if (Hls.isSupported()) {
	var hls = new Hls({
		loader: CacheLoader
	});
} else {
	console.error("HLS not supported");
}
