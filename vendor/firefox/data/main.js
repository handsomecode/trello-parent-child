var data = require("sdk/self").data;
var pageMod = require("sdk/page-mod");
var pref = require("sdk/simple-prefs").prefs;

pageMod.PageMod({
  include: ["*.trello.com"],
  contentScriptFile: [
    data.url("js/vendor/jquery.min.js"),
    data.url("js/vendor/jquery-ui.min.js"),
    data.url("js/config.js"),
    data.url("js/settings.js"),
    data.url("js/helpers.js"),
    data.url("js/pop-over.js"),
    data.url("js/notification.js"),
    data.url("js/api.js"),
    data.url("js/plugins/inheritance.js"),
    data.url("js/init.js")
  ],
  contentScriptWhen: "ready",
  contentStyleFile: [
    data.url("css/style.css")
  ],
  onAttach: function(worker) {
    worker.port.emit("loadPrefs", pref);
    worker.port.on("savePrefs", function(options) {
      for (var optionName in options) {
        pref[optionName] = options[optionName];
      }
    });
  }
});
