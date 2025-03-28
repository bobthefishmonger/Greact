const sqlite3 = require("sqlite3");
const path = require("path");

// Utils

function dbConnection() {
	return new sqlite3.Database(
		path.join(__dirname, "..", "Database", "Accounts.db"),
		(err) => {
			if (err) {
				console.error(err);
				throw Error("Failed to connect to database");
			}
			return true;
		}
	);
}

function dbClose(db) {
	db.close((err) => {
		if (err) {
			console.error(err);
			throw Error("Failed to close database");
		}
		return true;
	});
}

// Accounts

function GetAccountID(Username) {
	return new Promise((resolve, reject) => {
		try {
			const db = dbConnection();
			db.get(
				`
            SELECT AccountID
            FROM tblAccounts
            WHERE Username = ?
            `,
				[Username],
				(err, row) => {
					if (err) {
						dbClose(db);
						throw Error("SQL failed to run:", err.message);
					}
					resolve(row);
					dbClose(db);
				}
			);
		} catch (err) {
			console.error(err);
			reject("SQL ERROR");
		}
	});
}

function WriteAccount(Username, Password, Email, PhoneNumber, DOB) {
	return new Promise((resolve, reject) => {
		try {
			const db = dbConnection();
			db.run(
				`INSERT INTO tblAccounts(Username, Password, Email, PhoneNumber, DOB)
                VALUES (?,?,?,?,?)
                `,
				[Username, Password, Email, PhoneNumber, DOB],
				(err) => {
					if (err) {
						dbClose(db);
						throw Error("SQL failed to run:", err.message);
					}
					resolve(this.lastID);
					dbClose(db);
				}
			);
		} catch (err) {
			console.error(err);
			reject("SQL ERROR");
		}
	});
}

function CheckUserLogin(Username, Password) {
	return new Promise((resolve, reject) => {
		try {
			const db = dbConnection();
			db.get(
				`SELECT AccountID
				FROM tblAccounts
				WHERE Username=? AND Password=?`,
				[Username, Password],
				(err, row) => {
					if (err) {
						dbClose(db);
						throw Error("SQL failed to run:", err.message);
					}
					resolve(row);
					dbClose(db);
				}
			);
		} catch (err) {
			console.error(err);
			reject("SQL ERROR");
		}
	});
}

//Videos

function WriteVideo(Name, UploadDate) {
	return new Promise((resolve, reject) => {
		try {
			const db = dbConnection();
			db.run(
				`INSERT INTO tblVideos(Name, UploadDate)
				VALUES (?,?)`,
				[Name, UploadDate],
				(err) => {
					if (err) {
						dbClose(db);
						throw Error("SQL failed to run:", err.message);
					}
					resolve(this.lastID);
					dbClose(db);
				}
			);
		} catch (err) {
			console.error(err);
			reject("SQL ERROR");
		}
	});
}

function GetVideoInfo(VideoID) {
	return new Promise((resolve, reject) => {
		try {
			const db = dbConnection();
			db.get(
				`
            SELECT Name, UploadDate
            FROM tblVideos
            WHERE VideoID = ?
            `,
				[VideoID],
				(err, row) => {
					if (err) {
						dbClose(db);
						throw Error("SQL failed to run:", err.message);
					}
					resolve(row);
					dbClose(db);
				}
			);
		} catch (err) {
			console.error(err);
			reject("SQL ERROR");
		}
	});
}

function GetMaxID() {
	return new Promise((resolve, reject) => {
		const db = dbConnection();
		db.get(
			`
            SELECT MAX(VideoID)
            FROM tblVideos
            `,
			(err, row) => {
				if (err) {
					dbClose(db);
					throw Error("SQL failed to run:", err.message);
				}
				resolve(row["MAX(VideoID)"]);
			}
		);
		dbClose(db);
	});
}

function WriteUserWatch(AccountID, VideoID, Date) {
	return new Promise((resolve, reject) => {
		try {
			db.run;
		} catch (err) {
			console.error(err);
			reject("Error writing DB");
		}
	});
}

module.exports = {
	//Accounts
	GetAccountID,
	WriteAccount,
	CheckUserLogin,
	//Videos
	WriteVideo,
	GetVideoInfo,
	GetMaxID
};
