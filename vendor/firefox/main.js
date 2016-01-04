var data = require("sdk/self").data;
var pageMod = require("sdk/page-mod");

pageMod.PageMod({
	include: ["*.trello.com"],
	contentScriptFile: [
		data.url("js/vendor/jquery.min.js"),
		data.url("js/vendor/jquery-ui.min.js"),
		data.url("js/config.js"),
		data.url("js/api.js"),
		data.url("js/plugins/inheritance.js"),
		data.url("js/init.js")
	],
	contentScriptWhen: "ready",
	contentStyleFile: [
		data.url("css/style.css")
	]
});
