function loadSettings(options, callback) {
  safari.self.addEventListener('message', function (e) {
    if (e.name === 'updateSettings') {
      if (typeof callback === 'function') {
        callback(e.message);
      }
    }
  }, false);

  safari.self.tab.dispatchMessage('getSettings', options);
}

function saveSettings(options) {
  safari.self.tab.dispatchMessage('setSettings', options);
}
