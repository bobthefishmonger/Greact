const RedisClient = require("redisjson-express-session-store");
const argon = require("argon2");
const crypto = require("crypto");
const db = require("./dbManager.js");

async function ValidateUsername(Username) {
	const UsernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
	if (!UsernameRegex.test(Username)) {
		throw Error("Invalid Username");
	}
	if (await db.GetAccountID(Username)) {
		throw Error("Username In use");
	}
	return true;
}

function ValidatePassword(Password) {
	const PasswordRegex =
		/^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()])[A-Za-z\d!@#$%^&*()]{8,}$/;
	if (!PasswordRegex.test(Password)) {
		throw Error("Invalid Password");
	}
	return true;
}

function ValidateEmail(Email) {
	const EmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!EmailRegex.test(Email)) {
		throw Error("Invalid Email");
	}
	return true;
}

function ValidatePhoneNumber(PhoneNumber) {
	console.log(PhoneNumber);
	const PhoneRegex =
		/^\+?[1-9]\d{0,2}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/;

	if (!PhoneRegex.test(PhoneNumber)) {
		throw Error("Invalid Phone Number");
	}
	return true;
}

function ValidateDOB(DOB) {
	const DOBRegex = /^\d{4}-\d{2}-\d{2}$/;
	const BDate = new Date(DOB);
	const Now = new Date();
	if (!(DOBRegex.test(DOB) && BDate <= Now)) {
		throw Error("Invalid Date Of Birth");
	}
	let Age = Now.getFullYear() - BDate.getFullYear();
	const OffsetMonth = Now.getMonth() - BDate.getMonth();
	const OffsetDay = Now.getDate() - BDate.getDate();
	if (OffsetMonth < 0 || (OffsetMonth === 0 && OffsetDay < 0)) {
		Age--;
	}
	if (Age < 16) {
		throw Error("You must be 16 or over");
	}
	return true;
}

async function SignUp(req, res, Username, Password, Email, PhoneNumber, DOB) {
	try {
		await ValidateUsername(Username);
		ValidatePassword(Password);
		ValidateEmail(Email);
		ValidatePhoneNumber(PhoneNumber);
		ValidateDOB(DOB);
		const HashedPassword = await argon.hash(Password);
		const AccountID = await db.WriteAccount(
			Username,
			HashedPassword,
			Email,
			PhoneNumber,
			DOB
		);
		const AccountInfo = {
			LoggedIn: true,
			AccountID: AccountID,
			Username: Username
		};
		await RedisClient.setSession(req.sessionID, "AccountInfo", AccountInfo);
		res.send({
			Success: true,
			Redirect: `/account/signup/aboutyou?id=${crypto.randomUUID()}`
		});
	} catch (err) {
		res.send({ Success: false, Message: err.message });
	}
}

async function SignUpExtras(req, res, Interests, ProfileImage, Bio) {}

module.exports = {
	SignUp,
	SignUpExtras
};
