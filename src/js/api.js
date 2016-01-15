HandsomeTrello.api = {
  request: function (type, url, data, callback) {
    var self = this;

    var xhttp = new XMLHttpRequest();

    if (typeof data !== 'object') {
      data = {};
    }

    if (type.toLowerCase() !== 'get') {
      data.token = self.base.getCookie('token');
    } else if (Object.keys(data).length) {
      url += '?' + self.base.generateParamsStringFromObject(data);

      data = {};
    }

    xhttp.open(type.toUpperCase(), url, true);
    xhttp.setRequestHeader('Content-Type', 'application/json');
    xhttp.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

    xhttp.onreadystatechange = function () {
      if (xhttp.readyState === 4 && xhttp.status === 200 && typeof callback === 'function' && self.base.isJSONString(xhttp.responseText)) {
        callback(JSON.parse(xhttp.responseText));
      }
    };

    xhttp.send(JSON.stringify(data));
  },
  board: {
    get: function (boardId, callback) {
      var self = this.base;

      self.request('get', 'https://trello.com/1/boards/' + boardId, {
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

      self.request('get', 'https://trello.com/1/cards/' + cardId, {
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
        idBoard: self.base.data.boardId,
        idList: columnId
      };

      self.request('post', '/1/cards', data, callback);
    }
  },
  checklist: {
    getByCardId: function (cardId, callback) {
      var self = this.base;

      self.request('get', '/1/cards/' + cardId + '/checklists', {}, callback);
    },
    get: function (checklistId, callback) {
      var self = this.base;

      self.request('get', '/1/checklists/' + checklistId, {}, callback);
    },
    create: function (cardId, name, pos, callback) {
      var self = this.base;

      var data = {
        idCard: cardId,
        name: name,
        pos: pos
      };

      self.request('post', '/1/checklists', data, callback);
    },
    remove: function (checklistId, callback) {
      var self = this.base;

      self.request('delete', '/1/checklists/' + checklistId, {}, callback);
    },
    addItem: function (checklistId, name, pos, callback) {
      var self = this.base;

      var data = {
        name: name,
        pos: pos
      };

      self.request('post', '/1/checklists/' + checklistId + '/checkItems', data, callback);
    },
    deleteItem: function (checklistId, checkItemId, callback) {
      var self = this.base;

      var data = {
        idCheckItem: checkItemId
      };

      self.request('delete', '/1/checklists/' + checklistId + '/checkItems/' + checkItemId, data, callback);
    },
    posItem: function (cardId, checklistId, checkItemId, pos, callback) {
      var self = this.base;

      var data = {
        idChecklist: checklistId,
        idCheckItem: checkItemId,
        value: pos
      };

      self.request('put', '/1/cards/' + cardId + '/checklist/' + checklistId + '/checkItem/' + checkItemId + '/pos', data, callback);
    }
  },
  member: {
    get: function (username, data, callback) {
      var self = this.base;

      self.request('get', '/1/members/' + username, data, callback);
    }
  }
};
