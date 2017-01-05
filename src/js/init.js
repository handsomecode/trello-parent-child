(function (HandsomeTrello) {
  'use strict';

  HandsomeTrello.data = {
    init: false,
    loading: false,
    loaded: false,
    me: {},
    boardId: null,
    boardData: null,
    boardAccess: false,
    cards: {},
    columns: {},

    regexp: {
      boardPathname: /^\/b\/([a-zA-Z0-9]+)/,
      cardId: /#([0-9]+)/,
      cardIdFromLink: /\/c\/[a-zA-Z0-9]+\/([0-9]+)/,
      cardShortLink: /\/c\/([a-zA-Z0-9]+)/,
      cardPathname: /^\/c\/([a-zA-Z0-9]+)/
    },

    reloadTimeout: 0,
    reloadInterval: 0,
    updateBoardInterval: 0,
    updateTaskDescInterval: 0,
    updateLinkCheckInterval: 0,

    intervalTime: 50
  };

  HandsomeTrello.loadSettings = function () {
    var self = this;

    loadSettings(self.settings.options, function (options) {
      self.options = options;
    });
  };

  HandsomeTrello.saveSettings = function () {
    var self = this;

    saveSettings(self.options);
  };

  HandsomeTrello.getCardByLink = function (cardLink) {
    return this.data.cards[this.getCardIdFromLink(cardLink)];
  };

  HandsomeTrello.getCurrentOpenedCard = function () {
    var self = this;

    var _title = document.querySelector('.window .js-title-helper');
    if (_title && self.getCardShortLinkFromUrl()) {
      return self.getCardByLink(window.location.pathname);
    }

    return false;
  };

  // http://trello/c/uJOye8/25-test => 25
  // /c/uJOye8/25-test => 25
  HandsomeTrello.getCardIdFromLink = function (link) {
    var match = link.match(this.data.regexp.cardIdFromLink);

    return match ? match[1] : false;
  };

  HandsomeTrello.getCardShortLinkFromLink = function (link) {
    return link.match(this.data.regexp.cardShortLink)[1];
  };

  // http://trello/c/uJOye8 => uJOye8
  HandsomeTrello.getCardShortLinkFromUrl = function () {
    var self = this;

    var match = window.location.pathname.match(this.data.regexp.cardPathname);

    if (match) {
      self.getCardData(match[1]);

      return match[1];
    } else {
      return false;
    }
  };

  // http://trello/b/uJOye8 => uJOye8
  HandsomeTrello.getBoardShortLinkFromUrl = function () {
    var self = this;

    var match = window.location.pathname.match(this.data.regexp.boardPathname);

    if (match) {
      self.getBoardData(match[1]);

      return match[1];
    } else {
      return false;
    }
  };

  HandsomeTrello.getMeData = function () {
    var self = this;

    if (self.data.loading) {
      return false;
    }

    self.data.loading = true;

    self.api.member.get('me', {
      boards: 'all'
    }, function (error, data) {
      if (error) {
        HandsomeTrello.notification.open(
          HandsomeTrello.settings.notification.messages.error('Error: ' + error.message + '. Please, reload the page.')
        );

        self.data.loading = false;
      } else {
        self.data.me.data = data;

        if (data.prefs && typeof data.prefs.locale === 'string') {
          self.settings.locale = data.prefs.locale;
        }

        self.data.boardAccess =
          self.data.loaded &&
          self.data.boardId &&
          data.idBoards &&
          data.idBoards.length &&
          data.idBoards.indexOf(self.data.boardId) > -1;

        self.data.loading = false;

        if (!self.getBoardShortLinkFromUrl()) {
          self.getCardShortLinkFromUrl();
        }
      }
    });
  };

  HandsomeTrello.getCardData = function (id) {
    var self = this;

    if (self.data.boardId) {
      self.getBoardData(self.data.boardId);
    } else if (!self.data.loading) {
      self.data.loading = true;

      self.api.card.get(id, function (error, data) {
        if (error) {
          HandsomeTrello.notification.open(
            HandsomeTrello.settings.notification.messages.error('Error: ' + error.message + '. Please, reload the page.')
          );
        } else {
          self.getBoardData(data.idBoard, true);
        }
      });
    }
  };

  HandsomeTrello.getBoardData = function (id, init) {
    var self = this;

    if (!self.data.loaded && (!self.data.loading || init)) {
      self.data.loading = true;

      self.api.board.get(id, function (error, data) {
        self.data.loading = false;

        if (error) {
          HandsomeTrello.notification.open(
            HandsomeTrello.settings.notification.messages.error('Error: ' + error.message + '. Please, reload the page.')
          );
        } else {
          self.data.boardData = data;
          self.data.boardId = data.id;

          self.updateCards();

          self.data.loaded = true;

          self.data.boardAccess =
            data.id &&
            typeof self.data.me.data !== 'undefined' &&
            typeof data.members !== 'undefined' && !!self.helpers.getElementByProperty(data.members, 'id', self.data.me.data.id);
        }
      });
    }
  };

  HandsomeTrello.createCardData = function (cardData, _card, _cardLink, _column) {
    var self = this;

    return {
      id: cardData.id,
      idShort: cardData.idShort,
      title: cardData.name,
      pos: cardData.pos,
      status: cardData.closed ? 'closed' : 'opened',
      shortLink: cardData.shortLink,
      shortUrl: cardData.shortUrl,
      url: cardData.url,
      column: self.helpers.getElementByProperty(self.data.boardData.lists, 'id', cardData.idList),
      due: cardData.due,
      _element: _card,
      _link: _cardLink,
      _column: _column,
      data: cardData
    };
  };

  HandsomeTrello.parseCard = function (_card) {
    var self = this;

    var _cardLink = _card.querySelector('.js-card-name');

    if (!_cardLink || !_cardLink.href) {
      return false;
    }

    var cardLink = _cardLink.href,
      cardRealId = self.getCardShortLinkFromUrl(cardLink),
      cardId = self.getCardIdFromLink(cardLink),
      cardData = self.helpers.getElementByProperty(self.data.boardData.cards, 'idShort', cardId);

    if (!cardData && cardRealId) {
      cardData = {
        id: cardRealId,
        idShort: cardId,
        name: _cardLink.innerHTML.replace(/<span(.*)<\/span>/, '').trim(),
        url: cardLink,
        checklists: []
      };

      self.api.card.get(cardData.id, function (error, data) {
        if (error) {
          HandsomeTrello.notification.open(
            HandsomeTrello.settings.notification.messages.error('Error: ' + error.message + '. Please, reload the page.')
          );
        } else if (data && !self.helpers.getElementByProperty(self.data.boardData.cards, 'idShort', cardId)) {
          self.data.boardData.cards.push(data);

          self.parseCard(_card);
        }
      });
    }

    if (!cardData) {
      return false;
    }

    var _column = self.helpers.findParentByClass(_card, 'js-list');

    self.data.cards[cardData.idShort] = self.createCardData(cardData, _card, _cardLink, _column);

    var column = self.data.cards[cardData.idShort].column;

    if (typeof self.data.columns[column.id] === 'undefined') {
      self.data.columns[column.id] = {
        title: column.name,
        pos: column.pos,
        cards: {},
        _element: _column,
        data: column
      };
    }

    self.data.columns[column.id].cards[cardData.idShort] = self.data.cards[cardData.idShort];

    return self.data.cards[cardData.idShort];
  };

  HandsomeTrello.cardsUpdatedCallback = function () {
    var self = this;

    for (var pluginName in self.callbacks.cardsUpdated) {
      if (
        self.callbacks.cardsUpdated.hasOwnProperty(pluginName) &&
        typeof self.callbacks.cardsUpdated[pluginName] === 'function'
      ) {
        self.callbacks.cardsUpdated[pluginName]();
      }
    }
  };

  HandsomeTrello.waitCreatingCard = function (cardShortUrl, callback) {
    var self = this;

    var createCardInterval = setInterval(function () {
      var _card = document.querySelector('.js-card-name[href*="/c/' + self.getCardShortLinkFromLink(cardShortUrl) + '/"]');

      if (_card) {
        clearInterval(createCardInterval);

        self.helpers.lockDOM('wait-create-card', true);

        var card = self.parseCard(self.helpers.findParentByClass(_card, 'list-card'));

        self.cardsUpdatedCallback();

        self.helpers.lockDOM('wait-create-card', false);

        if (card && typeof callback === 'function') {
          callback(card);
        }
      }
    }, self.data.intervalTime);
  };

  HandsomeTrello.updateClosedCards = function () {
    var self = this;

    for (var i = 0; i < self.data.boardData.cards.length; i++) {
      var cardData = self.data.boardData.cards[i];

      if (cardData.closed === true) {
        self.data.cards[cardData.idShort] = self.createCardData(cardData);
      }
    }
  };

  HandsomeTrello.updateCards = function () {
    var self = this;

    clearInterval(self.data.updateBoardInterval);

    self.data.updateBoardInterval = setInterval(function () {
      var _cardsList = document.querySelectorAll('.list-card.js-member-droppable');

      if (_cardsList.length && self.data.boardId) {
        clearInterval(self.data.updateBoardInterval);

        self.helpers.lockDOM('update-cards', true);

        self.data.cards = {};
        self.data.columns = {};

        for (var i = 0; i < _cardsList.length; i++) {
          self.parseCard(_cardsList[i]);
        }

        self.updateClosedCards();

        self.cardsUpdatedCallback();

        self.data.init = true;

        self.helpers.lockDOM('update-cards', false);
      }
    }, self.data.intervalTime);
  };

  HandsomeTrello.openCardViewed = function () {
    var self = this;

    clearInterval(self.data.updateTaskDescInterval);

    self.data.updateTaskDescInterval = setInterval(function () {
      if (
        self.data.boardId &&
        self.getCardShortLinkFromUrl() &&
        document.querySelector('.js-card-desc') &&
        document.querySelector('.card-detail-item-block')
      ) {
        var currentCard = self.getCurrentOpenedCard();

        if (currentCard) {
          clearInterval(self.data.updateTaskDescInterval);

          var currentCardTitle = document.querySelector('.window .js-title-helper').textContent;

          self.helpers.lockDOM('open-card-view', true);

          for (var pluginName in self.callbacks.openCardViewed) {
            if (
              self.callbacks.openCardViewed.hasOwnProperty(pluginName) &&
              typeof self.callbacks.openCardViewed[pluginName] === 'function'
            ) {
              self.callbacks.openCardViewed[pluginName](currentCard, currentCardTitle);
            }
          }
          self.helpers.lockDOM('open-card-view', false);
        }
      }
    }, self.data.intervalTime);
  };

  HandsomeTrello.badgeChecklistUpdated = function (card) {
    var self = this;

    self.helpers.lockDOM('badge-checklist-update', true);

    for (var pluginName in self.callbacks.badgeChecklistUpdated) {
      if (
        self.callbacks.badgeChecklistUpdated.hasOwnProperty(pluginName) &&
        typeof self.callbacks.badgeChecklistUpdated[pluginName] === 'function'
      ) {
        self.callbacks.badgeChecklistUpdated[pluginName](card);
      }
    }

    self.helpers.lockDOM('badge-checklist-update', false);

    self.reloadData();
  };

  HandsomeTrello.updateLink = function (_cardLink) {
    var self = this;

    if (!_cardLink) {
      return false;
    }

    clearInterval(self.data.updateLinkCheckInterval);

    self.data.updateLinkCheckInterval = setInterval(function () {
      if (_cardLink && _cardLink.href) {
        clearInterval(self.data.updateLinkCheckInterval);

        var currentCard = self.getCardByLink(_cardLink.href);

        if (currentCard) {
          currentCard.title = _cardLink.innerHTML.replace(/<span(.*)<\/span>/, '').trim();
          currentCard.status = 'opened';
          currentCard.data.name = currentCard.title;
          currentCard.data.closed = false;

          self.cardsUpdatedCallback();
        } else {
          self.reloadData();
        }
      }
    }, self.data.intervalTime);
  };

  HandsomeTrello.reloadData = function (timeout) {
    var self = this;

    timeout = typeof timeout === 'number' ? timeout : typeof timeout === 'boolean' ? self.settings.reloadTimeout : 0;

    clearTimeout(self.data.reloadTimeout);
    clearInterval(self.data.reloadInterval);

    self.data.reloadTimeout = setTimeout(function () {
      self.data.reloadInterval = setInterval(function () {
        if (!self.data.loading) {
          clearInterval(self.data.reloadInterval);

          self.data.loaded = false;
          self.data.loading = false;

          if (!self.getBoardShortLinkFromUrl()) {
            self.getCardShortLinkFromUrl();
          }
        }
      }, self.data.intervalTime);
    }, timeout);
  };

  HandsomeTrello.init = function () {
    var self = this;

    self.api.board.base = self.api;
    self.api.card.base = self.api;
    self.api.checklist.base = self.api;
    self.api.member.base = self.api;

    self.loadSettings();

    for (var pluginName in self.plugins) {
      if (
        self.plugins.hasOwnProperty(pluginName) &&
        self.settings.plugins[pluginName] &&
        typeof self.plugins[pluginName].init === 'function'
      ) {
        self.plugins[pluginName].base = self;
        self.plugins[pluginName].init();
      }
    }

    document.body.addEventListener('DOMNodeInserted', function (e) {
      if (
        e.target.classList &&
        (
          e.target.classList.contains('board-wrapper') ||
          (!self.data.boardId && document.querySelector('.list-card'))
        )
      ) {
        if (self.data.loaded && e.target.classList.contains('board-wrapper')) {
          self.data.boardId = null;
          self.data.loaded = false;
          self.data.loading = false;
          self.data.boardAccess = false;
        }

        self.getMeData();
      }

      if (e.target.classList && e.target.classList.contains('checklist')) {
        for (var checklistInsertedPluginName in self.callbacks.checklistInserted) {
          if (
            self.callbacks.checklistInserted.hasOwnProperty(checklistInsertedPluginName) &&
            typeof self.callbacks.checklistInserted[checklistInsertedPluginName] === 'function'
          ) {
            self.callbacks.checklistInserted[checklistInsertedPluginName](e.target);
          }
        }
      }

      if (self.data.boardId && self.data.loaded && !self.helpers.checkLockedDOM()) {
        if (e.target.classList &&
          (
            (e.target.classList.contains('js-list'))
          )
        ) {
          self.reloadData(true);
        }

        if (
          (e.target.nodeName === '#text' && e.target.parentNode.classList.contains('js-card-desc')) ||
          (e.target.classList && e.target.classList.contains('card-detail-window'))
        ) {
          self.openCardViewed();
        }

        if (e.target.classList &&
          (
            (e.target.classList.contains('card-short-id')) ||
            (e.target.classList.contains('list-card') && e.target.classList.contains('js-member-droppable'))
          )
        ) {
          var _card =
              e.target.classList.contains('card-short-id') ?
                self.helpers.findParentByClass(e.target, 'list-card') :
                e.target,
            _cardLink = _card.querySelector('.js-card-name');

          self.updateLink(_cardLink);
        }

        if (e.target.classList && e.target.classList.contains('checklist-item')) {
          for (var checkItemUpdatedPluginName in self.callbacks.checkItemUpdated) {
            if (
              self.callbacks.checkItemUpdated.hasOwnProperty(checkItemUpdatedPluginName) &&
              typeof self.callbacks.checkItemUpdated[checkItemUpdatedPluginName] === 'function'
            ) {
              self.callbacks.checkItemUpdated[checkItemUpdatedPluginName](e.target);
            }
          }
        }

        if (e.target.classList && e.target.classList.contains('phenom-action')) {
          var deletedCardMatch = e.target.querySelector('.phenom-desc').textContent.match(/deleted card #([0-9]+) from/);

          if (
            deletedCardMatch &&
            parseInt(deletedCardMatch[1]) > 0 &&
            self.data.cards[deletedCardMatch[1]]
          ) {
            var cardData = self.helpers.getElementByProperty(self.data.boardData.cards, 'idShort', deletedCardMatch[1]);

            if (cardData) {
              self.data.boardData.cards.splice(self.data.boardData.cards.indexOf(cardData), 1);
            }

            self.updateCards();
          }
        }

        if (
          e.target.classList &&
          e.target.classList.contains('badge') &&
          e.target.querySelector('.icon-checklist')
        ) {
          var _parentTarget = self.helpers.findParentByClass(e.target, 'list-card');

          if (_parentTarget) {
            var _cardLinkByBadge = _parentTarget.querySelector('.js-card-name');

            if (_cardLinkByBadge && _cardLinkByBadge.href) {
              self.badgeChecklistUpdated(self.getCardByLink(_cardLinkByBadge.href));
            }
          }
        }
      }
    });

    document.body.addEventListener('DOMNodeRemoved', function (e) {
      if (self.data.boardId && self.data.loaded && !self.helpers.checkLockedDOM()) {
        if (e.target.classList && !e.target.classList.contains('ui-droppable') &&
          (
            (e.target.classList.contains('js-list')) ||
            (e.target.classList.contains('list-card') && e.target.classList.contains('js-member-droppable'))
          )
        ) {
          self.reloadData(true);
        }

        if (
          e.target.classList &&
          e.target.classList.contains('badge') &&
          e.target.querySelector('.icon-checklist')
        ) {
          var _parentTarget = self.helpers.findParentByClass(e.target, 'list-card');

          if (_parentTarget) {
            var _cardLink = _parentTarget.querySelector('.js-card-name');

            if (_cardLink && _cardLink.href) {
              self.badgeChecklistUpdated(self.getCardByLink(_cardLink.href));
            }
          }
        }
      }
    });

    document.body.addEventListener('DOMSubtreeModified', function (e) {
      if (self.data.boardId && self.data.loaded && !self.helpers.checkLockedDOM()) {
        if (
          e.target.classList &&
          (
            e.target.classList.contains('js-list') ||
            e.target.classList.contains('js-list-name')
          )
        ) {
          self.reloadData(true);
        }

        if (
          e.target.nodeName === '#text' &&
          e.target.textContent.match(/[0-9]+\/[0-9]+/) &&
          e.target.textContent.match(/[0-9]+\/[0-9]+/)[0] === e.target.textContent
        ) {
          var _parentTarget = self.helpers.findParentByClass(e.target, 'list-card');

          if (_parentTarget && _parentTarget.querySelector('.icon-checklist')) {
            var _cardLink = _parentTarget.querySelector('.js-card-name');

            if (_cardLink && _cardLink.href) {
              self.badgeChecklistUpdated(self.getCardByLink(_cardLink.href));
            }
          }
        }
      }
    });
  };

  HandsomeTrello.init();

})(HandsomeTrello);
