function loadSettings(options, callback) {
  self.port.on('loadPrefs', function (preferences) {
    var gettingOptions = {};

    for (var optionName in options) {
      gettingOptions[optionName] = typeof preferences[optionName] !== 'undefined' ? preferences[optionName] : options[optionName].value;
    }

    if (typeof callback === 'function') {
      callback(gettingOptions);
    }
  });

}

function saveSettings(options) {
  self.port.emit('savePrefs', options);
}
