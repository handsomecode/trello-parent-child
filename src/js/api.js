HandsomeTrello.api = {
  queue: [],

  running: false,

  request: function () {
    var self = this;

    if (!self.queue.length) {
      self.running = false;

      return false;
    }

    if (self.running) {
      return false;
    }

    self.running = true;

    var requestData = self.queue[0],
      xhttp = new XMLHttpRequest();

    if (typeof requestData.data !== 'object') {
      requestData.data = {};
    }

    if (requestData.type.toLowerCase() !== 'get') {
      requestData.data.token = HandsomeTrello.helpers.getCookie('token');
    } else if (Object.keys(requestData.data).length) {
      requestData.url += '?' + HandsomeTrello.helpers.generateGetParamsStringFromObject(requestData.data);

      requestData.data = {};
    }

    xhttp.open(requestData.type.toUpperCase(), requestData.url, true);
    xhttp.setRequestHeader('Content-Type', 'application/json');
    xhttp.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

    xhttp.onreadystatechange = function () {
      if (xhttp.readyState === 4) {
        if (xhttp.status === 200 && typeof requestData.callback === 'function' && HandsomeTrello.helpers.isJSONString(xhttp.responseText)) {
          requestData.callback(null, JSON.parse(xhttp.responseText));
        } else {
          console.error('Request Error:', xhttp.status, xhttp.responseText || xhttp.statusText);

          if (typeof requestData.callback === 'function') {
            requestData.callback({
              code: xhttp.status,
              message: xhttp.statusText
            });
          }
        }

        self.queue.splice(0, 1);

        self.running = false;

        self.request();
      }
    };

    xhttp.send(JSON.stringify(requestData.data));
  },

  addToQueue: function (type, url, data, callback) {
    var self = this;

    self.queue.push({
      type: type,
      url: url,
      data: data,
      callback: callback
    });

    self.request();
  },

  board: {
    get: function (boardId, callback) {
      var self = this.base;

      self.addToQueue('get', 'https://trello.com/1/boards/' + boardId, {
        lists: 'open',
        cards: 'all',
        card_checklists: 'all',
        members: 'all'
      }, callback);
    }
  },

  card: {
    get: function (cardId, callback) {
      var self = this.base;

      self.addToQueue('get', 'https://trello.com/1/cards/' + cardId, {
        checklists: 'all'
      }, callback);
    },
    create: function (title, columnId, pos, callback) {
      var self = this.base;

      var data = {
        name: title,
        pos: pos,
        dateLastActivity: Date.now(),
        closed: false,
        idLabels: [],
        idMembers: [],
        idBoard: HandsomeTrello.data.boardId,
        idList: columnId
      };

      self.addToQueue('post', '/1/cards', data, callback);
    }
  },

  checklist: {
    getByCardId: function (cardId, callback) {
      var self = this.base;

      self.addToQueue('get', '/1/cards/' + cardId + '/checklists', {}, callback);
    },
    get: function (checklistId, callback) {
      var self = this.base;

      self.addToQueue('get', '/1/checklists/' + checklistId, {}, callback);
    },
    create: function (cardId, name, pos, callback) {
      var self = this.base;

      var data = {
        idCard: cardId,
        name: name,
        pos: pos
      };

      self.addToQueue('post', '/1/checklists', data, callback);
    },
    remove: function (checklistId, callback) {
      var self = this.base;

      self.addToQueue('delete', '/1/checklists/' + checklistId, {}, callback);
    },
    addItem: function (checklistId, name, pos, callback) {
      var self = this.base;

      var data = {
        name: name,
        pos: pos
      };

      self.addToQueue('post', '/1/checklists/' + checklistId + '/checkItems', data, callback);
    },
    deleteItem: function (checklistId, checkItemId, callback) {
      var self = this.base;

      var data = {
        idCheckItem: checkItemId
      };

      self.addToQueue('delete', '/1/checklists/' + checklistId + '/checkItems/' + checkItemId, data, callback);
    },
    nameItem: function (cardId, checklistId, checkItemId, name, callback) {
      var self = this.base;

      var data = {
        idChecklist: checklistId,
        idCheckItem: checkItemId,
        value: name
      };

      self.addToQueue('put', '/1/cards/' + cardId + '/checklist/' + checklistId + '/checkItem/' + checkItemId + '/name', data, callback);
    },
    changeItemPos: function (cardId, checklistId, checkItemId, pos, callback) {
      var self = this.base;

      var data = {
        idChecklist: checklistId,
        idCheckItem: checkItemId,
        value: pos
      };

      self.addToQueue('put', '/1/cards/' + cardId + '/checklist/' + checklistId + '/checkItem/' + checkItemId + '/pos', data, callback);
    }
  },

  member: {
    get: function (username, data, callback) {
      var self = this.base;

      self.addToQueue('get', '/1/members/' + username, data, callback);
    }
  }
};
