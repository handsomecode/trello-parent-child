(function (window) {
  'use strict';

  function sendError(e) {
    var userData = {
      username: '',
      fullname: '',
      email: ''
    };

    if (
        typeof TrelloHelper !== 'undefined' &&
        typeof TrelloHelper.data !== 'undefined' &&
        typeof TrelloHelper.data.me !== 'undefined' &&
        typeof TrelloHelper.data.me.data !== 'undefined' &&
        typeof TrelloHelper.data.me.data.username !== 'undefined' &&
        typeof TrelloHelper.data.me.data.fullName !== 'undefined' &&
        typeof TrelloHelper.data.me.data.email !== 'undefined'
    ) {
      userData.username = TrelloHelper.data.me.data.username;
      userData.fullname = TrelloHelper.data.me.data.fullName;
      userData.email = TrelloHelper.data.me.data.email;
    }

    var xhr = new XMLHttpRequest();

    xhr.open('POST', 'https://api.airtable.com/v0/appubz6id6ulcTeUr/Errors', true);

    xhr.setRequestHeader('Authorization', 'Bearer keyU9uhDHsoLen1Gs');
    xhr.setRequestHeader('Content-type', 'application/json');

    xhr.send(JSON.stringify({
      fields: {
        Message: e.message,
        Date: new Date().toISOString(),
        Version: chrome.runtime.getManifest().version,
        Username: userData.username,
        Fullname: userData.fullname,
        Email: userData.email,
        Notes: e.stack,
        Browser: navigator.userAgent,
        URL: window.location.href
      }
    }));
  }

  function wrap(func) {
    if (!func._wrapped) {
      func._wrapped = function () {
        try {
          func.apply(this, arguments);
        } catch (e) {
          sendError(e);
        }
      }
    }
    return func._wrapped;
  }

  var addEventListener = window.EventTarget.prototype.addEventListener;
  window.EventTarget.prototype.addEventListener = function (event, callback, bubble) {
    addEventListener.call(this, event, wrap(callback), bubble);
  };

})(window);
