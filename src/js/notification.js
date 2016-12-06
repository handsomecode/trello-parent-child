HandsomeTrello.notification = {
  data: {
    timeout: 0
  },

  open: function (_message, type, timeout) {
    if (typeof type === 'undefined') {
      type = 'warning';
    }

    if (typeof timeout === 'undefined') {
      timeout = HandsomeTrello.settings.notification.defaultTimeout;
    }

    var _notification = document.getElementById('notification'),
      _notificationContent = document.createElement('div');

    _notificationContent.setAttribute(
      'class',
      'handsome-trello__inheritance-notification js-inheritance-notification app-alert-item mod-' + type
    );
    _notificationContent.appendChild(_message);

    _notification.appendChild(_notificationContent);

    _notification.style.display = 'block';

    this.data.timeout = setTimeout(function () {
      HandsomeTrello.helpers.removeElement(_notificationContent);
    }, timeout);
  }
};
