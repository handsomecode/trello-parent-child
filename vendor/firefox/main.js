var data = require("sdk/self").data;
var pageMod = require("sdk/page-mod");

pageMod.PageMod({
  include: ["*.trello.com"],
  contentScriptFile: [
    data.url("content/scripts/libs/jquery.js"),
    data.url("content/scripts/libs/jquery-ui.js"),
    data.url("content/scripts/config.js"),
    data.url("content/scripts/api.js"),
    data.url("content/scripts/plugins/inheritance.js"),
    data.url("content/scripts/init.js")
  ],
  contentScriptWhen: "ready",
  contentStyleFile: [
    data.url("content/css/style.css")
  ]
});
