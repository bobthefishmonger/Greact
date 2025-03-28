async function SignUp() {
	// SignUp(e)
	//e.preventDefault();
	const Data = {
		Username: "huihuihfiuhs",
		Password: "Bob123!!!!!",
		Email: "bob@g.co", // smth@smth.smth
		PhoneNumber: "+44 7400954783", // +2nums number
		DOB: "2008-09-03" // yyyy-mm-dd
	};
	let Response = await fetch("/account/signup", {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify(Data)
	});
	Response = await Response.json();
	if (!Response.Success) {
		// reason stored in Response.Message
		alert(Response.Message);
		return false;
	}
	window.location.href = window.location.origin + Response.Redirect;
	return true;
}
