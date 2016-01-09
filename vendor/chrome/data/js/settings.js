function loadSettings(options, callback) {
  var gettingOptions = {};

  for (var optionName in options) {
    gettingOptions[optionName] = options[optionName].value;
  }

  chrome.storage.sync.get(gettingOptions, function(localOptions) {
    if (typeof callback === 'function') {
      callback(localOptions);
    }
  });
}

function saveSettings(options) {
  chrome.storage.sync.set(options);
}
