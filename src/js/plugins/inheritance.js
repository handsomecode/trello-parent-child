(function () {
  'use strict';

  TrelloHelper.plugins.inheritance = {
    base: {},

    data: {
      childrenName: 'Children',
      checkChildrenInterval: 0,
      cardsWithWaitingChildrenChecklists: []
    },

    parseCard: function (card) {
      var self = this;

      self.changeChildrenInCard(card);
    },

    readCards: function () {
      var self = this;

      self.base.lockDOM('inheritance-read-cards', true);

      for (var cardId in self.base.data.cards) {
        self.parseCard(self.base.data.cards[cardId]);
      }

      self.updateCardView();

      self.base.lockDOM('inheritance-read-cards', false);
    },

    generateHtmlForParent: function (parentCard) {
      var self = this;

      if (document.querySelector('.js-card-parent')) {
        self.base.removeElement(document.querySelector('.js-card-parent'));
      }

      if (typeof parentCard === 'undefined') {
        return '';
      }

      var html = '<div class="js-card-parent">';
      html += '<h3 class="card-detail-item-header">Parent:</h3>';
      html += '<p class="handsome-trello__inheritance-parent"><a href="' + parentCard.url + '" class="handsome-trello__inheritance-link">' + parentCard.title + '</a> (' + parentCard.column.name + ')</p>';
      html += '</div>';

      return html;
    },

    generateHtmlForOneChildren: function (children, level) {
      var self = this;

      var html = '<ul class="handsome-trello__inheritance-children-list' + (level === 0 ? ' js-children-list' : '') + '">';

      for (var i = 0; i < children.length; i++) {
        var childCard = children[i];

        if (typeof childCard !== 'undefined') {
          html += '' +
              '<li class="handsome-trello__inheritance-children-item"' + (level === 0 ? ' children-id="' + childCard.checkItem.id + '" children-pos="' + childCard.checkItem.pos : '') + '">' +
              ' <a href="' + childCard.url + '" class="handsome-trello__inheritance-link">' + childCard.title + '</a>' +
              ' (' + childCard.column.name + ')';

          if (typeof childCard.children !== 'undefined' && childCard.children.length) {
            html += self.generateHtmlForOneChildren(childCard.children, level + 1);
          }

          html += '</li>';
        }
      }

      html += '</ul>';

      return html;
    },

    generateHtmlForChildren: function (children) {
      var self = this;

      if (document.querySelector('.js-card-children')) {
        self.base.removeElement(document.querySelector('.js-card-children'));
      }

      if (typeof children === 'undefined' || !children.length) {
        return '';
      }

      var html = '<div class="handsome-trello__children js-card-children">';
      html += '<h3 class="handsome-trello__children-title card-detail-item-header">Children:</h3>';

      html += self.generateHtmlForOneChildren(children, 0);

      html += '</div>';

      return html;
    },

    generateHtmlForRelatedTasks: function (card, parent) {
      var self = this;

      if (document.querySelector('.js-card-related')) {
        self.base.removeElement(document.querySelector('.js-card-related'));
      }

      if (typeof parent === 'undefined' || typeof parent.children === 'undefined' || !parent.children.length || (parent.children.length === 1 && parent.children[0] === card)) {
        return '';
      }

      var html = '<div class="js-card-related">';
      html += '<h3 class="card-detail-item-header">Related:</h3><ul class="handsome-trello__inheritance-related-list">';

      for (var i = 0; i < parent.children.length; i++) {
        var relatedCard = parent.children[i];

        if (card !== relatedCard) {
          html += '<li class="handsome-trello__inheritance-related-item"><a href="' + relatedCard.url + '" class="handsome-trello__inheritance-link">' + relatedCard.title + '</a> (' + relatedCard.column.name + ')</li>';
        }
      }

      html += '</ul></div>';

      return html;
    },

    searchInString: function (stringLine, searchLine) {
      var stringArray = stringLine.replace(/ +(?= )/g, '').replace(/[^0-9A-Za-zА-Яа-яЁё ]/g, '').trim().split(' '),
          searchArray = searchLine.replace(/ +(?= )/g, '').replace(/[^0-9A-Za-zА-Яа-яЁё ]/g, '').trim().split(' '),
          matchesCount = 0;

      for (var y = 0; y < searchArray.length; y++) {
        for (var i = 0; i < stringArray.length; i++) {
          if ((y === searchArray.length - 1 && stringArray[i].indexOf(searchArray[y]) === 0) || stringArray[i].toLowerCase() == searchArray[y].toLowerCase()) {
            matchesCount++;

            break;
          }
        }
      }

      return matchesCount === searchArray.length;
    },

    openParentPopOver: function (target) {
      var self = this;

      var currentOpenedCard = self.base.getCurrentOpenedCard(),
          currentParent,
          currentItems = [],
          currentQueryString = undefined,
          selectedItemIndex = undefined;

      if (typeof currentOpenedCard.parent !== 'undefined') {
        currentParent = {
          id: currentOpenedCard.parent.id,
          title: currentOpenedCard.parent.title
        };
      }

      var html = '';

      html += '' +
          '<div>' +
          ' <input class="js-search-parent js-autofocus" type="text" placeholder="Search parent">' +
          ' <ul class="pop-over-card-list handsome-trello__inheritance-pop-over-parent-list checkable js-parent-list">' +
          ' </ul>' +
          '</div>';

      self.base.popOver(true, 'Set Parent', html, target);

      var _popOverContent = document.querySelector('.js-fill-pop-over-content'),
          _popOverParentList = _popOverContent.querySelector('.js-parent-list');

      generateCardsList();

      _popOverContent.querySelector('.js-search-parent').focus();

      function generateCardsList() {
        var _searchParentField = document.querySelector('.js-search-parent');

        if (currentQueryString === _searchParentField.value) {
          return false;
        }

        currentQueryString = _searchParentField.value;

        var cardsListHtml = '';

        if (_searchParentField && _searchParentField.value.length) {
          currentItems = [];

          for (var cardId in self.base.data.cards) {
            var card = self.base.data.cards[cardId];

            if (card !== currentOpenedCard && self.searchInString(card.title.toLowerCase(), _searchParentField.value.toLowerCase())) {
              cardsListHtml += '' +
                  '   <li class="item js-parent-item' + (currentOpenedCard.parent && card.id === currentOpenedCard.parent.id ? ' active' : '') + (!currentItems.length ? ' selected' : '') + '">' +
                  '     <a href="#" title="' + card.title + '" class="name js-select-parent" parent-index="' + currentItems.length + '">' +
                  '       <span class="full-name">' + card.title + '</span>' +
                  '       <span class="icon-sm icon-check checked-icon"></span>' +
                  '     </a>' +
                  '   </li>' +
                  '';

              currentItems.push(card);
            }
          }

          _popOverParentList.innerHTML = cardsListHtml;

          selectItem(currentItems.length ? 0 : undefined, true);
        } else if (currentOpenedCard.parent) {
          cardsListHtml += '' +
              '   <li class="item js-parent-item' + (currentParent && currentParent.id === currentOpenedCard.parent.id ? ' active' : '') + '">' +
              '     <a href="#" title="' + currentOpenedCard.parent.title + '" class="name js-select-parent" parent-index="0">' +
              '       <span class="full-name">' + currentOpenedCard.parent.title + '</span>' +
              '       <span class="icon-sm icon-check checked-icon"></span>' +
              '     </a>' +
              '   </li>' +
              '';

          currentItems = [currentOpenedCard.parent];

          _popOverParentList.innerHTML = cardsListHtml;

          selectItem(undefined, true);
        } else {
          _popOverParentList.innerHTML = '';
        }

        var _popOverParentItems = _popOverParentList.querySelectorAll('.js-parent-item');

        for (var i = 0; i < _popOverParentItems.length; i++) {
          _popOverParentItems[i].addEventListener('mouseover', function (e) {
            selectItem(parseInt(e.currentTarget.querySelector('.js-select-parent').getAttribute('parent-index')), true);
          });

          _popOverParentItems[i].querySelector('.js-select-parent').addEventListener('click', function (e) {
            e.preventDefault();

            self.changeParent(currentOpenedCard, currentItems[parseInt(e.currentTarget.getAttribute('parent-index'))]);
          });
        }
      }

      function selectItem(index, notUndefined) {
        var _currentItems = _popOverParentList.querySelectorAll('.js-parent-item');

        if (_currentItems.length) {
          if (typeof selectedItemIndex !== 'undefined' && typeof _currentItems[selectedItemIndex] !== 'undefined' && (!notUndefined || selectedItemIndex !== index)) {
            _currentItems[selectedItemIndex].classList.remove('selected');
          }

          if (typeof index !== 'undefined' && typeof _currentItems[index] !== 'undefined' && selectedItemIndex !== index) {
            _currentItems[index].classList.add('selected');
          }

          selectedItemIndex = selectedItemIndex !== index || notUndefined ? index : undefined;
        }
      }

      _popOverContent.querySelector('.js-search-parent').addEventListener('keyup', function () {
        generateCardsList();
      });

      _popOverContent.querySelector('.js-search-parent').addEventListener('keydown', function (e) {
        if (e.keyCode === 13 && typeof selectedItemIndex !== 'undefined' && typeof currentItems[selectedItemIndex] !== 'undefined') { // Enter
          self.changeParent(currentOpenedCard, currentItems[selectedItemIndex]);
        } else if (e.keyCode === 38) { // Arrow Up
          selectItem(typeof selectedItemIndex !== 'undefined' && selectedItemIndex - 1 >= 0 ? selectedItemIndex - 1 : currentItems.length - 1);
        } else if (e.keyCode === 40) { // Arrow Down
          selectItem(typeof selectedItemIndex !== 'undefined' && selectedItemIndex + 1 < currentItems.length ? selectedItemIndex + 1 : 0);
        }
      });
    },

    openChildrenPopOver: function (target) {
      var self = this;

      var currentOpenedCard = self.base.getCurrentOpenedCard(),
          currentColumn = false,
          currentPosition = 'bottom',
          positionsList = [],
          columnsHtml = '',
          positionsHtml = '';

      for (var i = 0; i < self.base.data.boardData.lists.length; i++) {
        var column = self.base.data.boardData.lists[i],
            isCurrentColumn = currentOpenedCard && column.name === currentOpenedCard.column.name;

        if (!currentColumn || isCurrentColumn) {
          currentColumn = column;
        }

        columnsHtml += '' +
            '       <option value="' + column.id + '"' + (isCurrentColumn ? ' selected="selected"' : '') + '>' + column.name + (isCurrentColumn ? ' (current)' : '') + '</option>';
      }

      generatePositionsList();

      var html = '' +
          '<div>' +
          ' <div class="form-grid">' +
          '   <input type="text" placeholder="Title" class="js-children-title" />' +
          ' </div>' +
          ' <div class="form-grid">' +
          '   <div class="button-link setting form-grid-child form-grid-child-threequarters">' +
          '     <span class="label">List</span>' +
          '     <span class="value js-children-list-value">' + currentColumn.name + '</span>' +
          '     <label>List</label>' +
          '     <select class="js-children-select-list">' +

          columnsHtml +

          '     </select>' +
          '   </div>' +
          '   <div class="button-link setting form-grid-child form-grid-child-quarter">' +
          '     <span class="label">Position</span>' +
          '     <span class="value js-children-position-value">' + currentPosition + '</span>' +
          '     <label>Position</label>' +
          '     <select class="js-children-select-position">' +

          positionsHtml +

          '     </select>' +
          '   </div>' +
          ' </div>' +
          ' <div class="form-grid">' +
          '   <input class="primary wide js-children-create" type="submit" value="Create">' +
          '   <div class="check-div handsome-trello__inheritance-pop-over-children-checkbox">' +
          '     <input type="checkbox" id="pop-over-children-checkbox"' + (self.base.settings.openChildCard ? ' checked="checked"' : '') + ' />' +
          '     <label for="pop-over-children-checkbox">Open Child Card</label>' +
          '   </div>' +
          '</div>';

      self.base.popOver(true, 'Add Child', html, target);

      document.getElementById('pop-over-children-checkbox').addEventListener('change', function (e) {
        self.base.settings.openChildCard = e.target.checked;
      });

      function generatePositionsList() {
        var prevCardPos = undefined;

        positionsHtml = '';
        positionsList = [];

        for (var i = 0; i < self.base.data.boardData.cards.length; i++) {
          var card = self.base.data.boardData.cards[i];

          if (card.idList === currentColumn.id) {
            var currentPos = (prevCardPos ? (card.pos + prevCardPos) / 2 : 'top');
            positionsList[currentPos] = Object.keys(positionsList).length + 1;

            positionsHtml += '' +
                '       <option value="' + currentPos + '">' + positionsList[currentPos] + '</option>';

            prevCardPos = card.pos;
          }
        }

        positionsList['bottom'] = Object.keys(positionsList).length + 1;
        positionsHtml += '' +
            '       <option value="bottom" selected="selected">' + positionsList['bottom'] + '</option>';

        currentPosition = Object.keys(positionsList).length;
      }

      function createNewCard() {
        if (document.querySelector('.js-children-title').value.length) {
          self.base.api.card.create(document.querySelector('.js-children-title').value, document.querySelector('.js-children-select-list').value, document.querySelector('.js-children-select-position').value, function (cardData) {
            cardData.checklists = [];

            self.base.data.boardData.cards.push(cardData);

            self.base.waitCreatingCard(cardData.shortUrl, function (card) {
              if (typeof currentOpenedCard.children !== 'undefined' && currentOpenedCard.children.length) {
                self.base.api.checklist.addItem(currentOpenedCard.childrenChecklist.id, '#' + cardData.idShort, 'bottom', function (checkItemData) {
                  currentOpenedCard.childrenChecklist.checkItems.push(checkItemData);

                  self.base.lockDOM('inheritance-create-new-card', true);

                  self.readCards();

                  self.base.lockDOM('inheritance-create-new-card', false);

                  if (self.base.settings.openChildCard) {
                    self.base.goToLink(cardData.url);
                  }
                });
              } else {
                self.data.cardsWithWaitingChildrenChecklists.push(currentOpenedCard.id);

                self.base.api.checklist.create(currentOpenedCard.id, self.data.childrenName, 'top', function (checkListData) {
                  self.base.api.checklist.addItem(checkListData.id, '#' + cardData.idShort, 'bottom', function (checkItemData) {
                    checkListData.checkItems = [checkItemData];
                    currentOpenedCard.data.checklists.push(checkListData);
                    currentOpenedCard.childrenChecklist = currentOpenedCard.data.checklists[currentOpenedCard.data.checklists.length - 1];

                    self.data.cardsWithWaitingChildrenChecklists.splice(self.data.cardsWithWaitingChildrenChecklists.indexOf(currentOpenedCard.id), 1);

                    self.base.lockDOM('inheritance-create-new-card', true);

                    self.readCards();

                    self.base.lockDOM('inheritance-create-new-card', false);

                    if (self.base.settings.openChildCard) {
                      self.base.goToLink(cardData.url);
                    }
                  });
                });
              }
            });
          });

          self.base.popOver(false);
        }
      }

      var _popOverContent = document.querySelector('.js-fill-pop-over-content');

      _popOverContent.querySelector('.js-children-title').focus();

      _popOverContent.querySelector('.js-fill-pop-over-content .js-children-select-list').addEventListener('change', function () {
        currentColumn = self.base.getElementByProperty(self.base.data.boardData.lists, 'id', this.value);
        this.parentElement.querySelector('.js-children-list-value').innerHTML = currentColumn.name;

        generatePositionsList();
        this.parentElement.parentElement.querySelector('.js-children-select-position').innerHTML = positionsHtml;
        this.parentElement.parentElement.querySelector('.js-children-position-value').innerHTML = currentPosition;
      });

      _popOverContent.querySelector('.js-fill-pop-over-content .js-children-select-position').addEventListener('change', function () {
        this.parentElement.querySelector('.js-children-position-value').innerHTML = positionsList[this.value];
      });

      _popOverContent.querySelector('.js-children-create').addEventListener('click', function () {
        createNewCard();
      });

      _popOverContent.querySelector('.js-children-title').addEventListener('keydown', function (e) {
        if (e.keyCode === 13) {
          createNewCard();
        }
      });
    },

    addButtonsOnRightSidebar: function () {
      var self = this;

      var _sidebarAdd = document.querySelector('.window-sidebar .window-module div');

      if (!_sidebarAdd || !self.base.data.boardAccess) {
        return false;
      }

      var _sidebarParentBtn = _sidebarAdd.querySelector('.js-parent-btn'),
          _sidebarChildBtn = _sidebarAdd.querySelector('.js-child-btn');

      if (_sidebarParentBtn && _sidebarChildBtn) {
        return false;
      }

      if (_sidebarParentBtn) {
        self.base.removeElement(_sidebarParentBtn);
      }

      if (_sidebarChildBtn) {
        self.base.removeElement(_sidebarChildBtn);
      }

      _sidebarAdd.appendChild(
          self.base.generateElementFromString(
              '<a href="#" class="button-link js-parent-btn"> <span class="icon-sm handsome-icon-parent"></span> Parent</a>'
          )
      );

      _sidebarAdd.appendChild(
          self.base.generateElementFromString(
              '<a href="#" class="button-link js-child-btn"> <span class="icon-sm handsome-icon-child"></span> Child</a>'
          )
      );

      _sidebarAdd.querySelector('.js-parent-btn').addEventListener('click', function (e) {
        e.preventDefault();

        self.openParentPopOver(e.currentTarget);
      });

      _sidebarAdd.querySelector('.js-child-btn').addEventListener('click', function (e) {
        e.preventDefault();

        self.openChildrenPopOver(e.currentTarget);
      });
    },

    bindDragAndDropOnChildren: function (card) {
      var self = this;

      if (!card.childrenChecklist || !self.base.data.boardAccess) {
        return false;
      }

      window.jQuery('.js-children-list').sortable({
        axis: 'y',
        delay: 75,
        distance: 7,
        tolerance: 'pointer',
        items: '> li',
        placeholder: 'handsome-trello__inheritance-children-placeholder',
        update: function (event, ui) {
          var $prevItem = ui.item.prev(),
              $nextItem = ui.item.next(),
              checkItemId = ui.item.attr('children-id'),
              newPosition =
                  !$prevItem.length || !$prevItem.attr('children-pos').length ? 'top' :
                      !$nextItem.length || !$nextItem.attr('children-pos').length ? 'bottom' :
                      (parseInt($prevItem.attr('children-pos')) + parseInt($nextItem.attr('children-pos'))) / 2;

          self.base.api.checklist.posItem(card.id, card.childrenChecklist.id, checkItemId, newPosition, function (data) {
            if (data && typeof data.pos !== 'undefined') {
              self.base.getElementByProperty(card.childrenChecklist.checkItems, 'id', checkItemId).pos = data.pos;
              self.base.sortByProperty(card.children, 'checkItem.pos');
              ui.item.attr('children-pos', data.pos);
            }
          });
        }
      })
    },

    updateInheritanceListInOpenedCardView: function (card) {
      var self = this;

      if (card) {
        var _descParentElement = document.querySelector('.js-card-desc').parentElement;

        _descParentElement.innerHTML = self.generateHtmlForChildren(card.children) + _descParentElement.innerHTML;
        _descParentElement.innerHTML = self.generateHtmlForRelatedTasks(card, card.parent) + _descParentElement.innerHTML;
        _descParentElement.innerHTML = self.generateHtmlForParent(card.parent) + _descParentElement.innerHTML;

        self.bindDragAndDropOnChildren(card);
      }
    },

    updateCardView: function (card) {
      var self = this;

      if (typeof card === 'undefined') {
        card = self.base.getCurrentOpenedCard();
      }

      if (card) {
        self.updateInheritanceListInOpenedCardView(card);

        self.addButtonsOnRightSidebar();
      }
    },

    clearBadgeInCard: function (card) {
      var self = this;

      if (!card._element) {
        return false;
      }

      self.base.lockDOM('inheritance-clear-badge-card', true);

      var _checklistBadge = card._element.querySelector('.js-checklist-badge'),
          _checklistFakeBadge = card._element.querySelector('.js-fake-checklist-badge');

      if (!_checklistBadge) {
        if (_checklistFakeBadge) {
          self.base.removeElement(_checklistFakeBadge);
          _checklistFakeBadge = undefined;
        }

        if (card._element.querySelector('.badge .icon-checklist')) {
          _checklistBadge = self.base.findParentByClass(card._element.querySelector('.badge .icon-checklist'), 'badge');
          _checklistBadge.classList.add('js-checklist-badge');
        } else {
          self.base.lockDOM('inheritance-clear-badge-card', false);

          return false;
        }
      }

      if (!_checklistFakeBadge) {
        _checklistFakeBadge = self.base.generateElementFromString(_checklistBadge.outerHTML);
        _checklistFakeBadge.classList.remove('js-checklist-badge');
        _checklistFakeBadge.classList.add('js-fake-checklist-badge');
        self.base.appendElementAfterAnother(_checklistFakeBadge, _checklistBadge);
      }

      _checklistBadge.classList.add('hide');

      if (typeof card.childrenChecklist !== 'undefined' && card.data.checklists.length === 1) {
        _checklistFakeBadge.classList.add('hide');
      } else {
        var countCheckItems = 0,
            countCompleteCheckItems = 0;

        for (var x = 0; x < card.data.checklists.length; x++) {
          var currentChecklist = card.data.checklists[x];

          if (typeof card.childrenChecklist === 'undefined' || currentChecklist !== card.childrenChecklist) {
            for (var z = 0; z < currentChecklist.checkItems.length; z++) {
              countCheckItems++;

              if (currentChecklist.checkItems[z].state !== 'incomplete') {
                countCompleteCheckItems++;
              }
            }
          }
        }

        if (countCheckItems) {
          _checklistFakeBadge.classList.remove('hide');
          _checklistFakeBadge.querySelector('.badge-text').innerHTML = countCompleteCheckItems + '/' + countCheckItems;
        } else {
          _checklistFakeBadge.classList.add('hide');
        }
      }

      self.base.lockDOM('inheritance-clear-badge-card', false);
    },

    checkRecursion: function (object, property, value, oldParentsArray) {
      var self = this;

      if (typeof oldParentsArray === 'undefined') {
        oldParentsArray = [];
      }

      if (typeof object !== 'undefined' && typeof object[property] !== 'undefined') {
        if (object[property] === value) {
          return object;
        } else {
          var checkInParentsArray = self.base.getElementByProperty(oldParentsArray, 'value', value);

          if (checkInParentsArray) {
            return checkInParentsArray.object
          } else {
            oldParentsArray.push({
              object: object,
              value: object[property]
            });

            return self.checkRecursion(object[property], property, value, oldParentsArray);
          }
        }
      } else {
        return false;
      }
    },

    changeParent: function (card, parent) {
      var self = this;

      if (parent) {
        var checkDeleteParentFromCard = false;

        // removing current parent

        if (card.parent) {
          checkDeleteParentFromCard = card.parent === parent;

          self.removeParent(card);

          if (checkDeleteParentFromCard) {
            self.readCards();
          }
        }

        // end removing current parent

        if (!checkDeleteParentFromCard) {
          // check recursion

          var checkParentRecursionCard = self.checkRecursion(parent, 'parent', card);

          if (checkParentRecursionCard) {
            console.warn(self.base.settings.notification.messages.recursionOnBoard
                .replace(/%recursionCardTitle%/g, checkParentRecursionCard.url)
                .replace(/%recursionCardLink%/g, checkParentRecursionCard.url)
                .replace(/%currentCardTitle%/g, card.url)
                .replace(/%currentCardLink%/g, card.url)
                .replace(/<\/?[^>]+(>|$)/g, '')
                .trim());

            self.base.openNotification(self.base.settings.notification.messages.recursionOnBoard
                .replace(/%recursionCardTitle%/g, '#' + checkParentRecursionCard.idShort + ' ' + checkParentRecursionCard.title)
                .replace(/%recursionCardLink%/g, checkParentRecursionCard.url)
                .replace(/%currentCardTitle%/g, '#' + card.idShort + ' ' + card.title)
                .replace(/%currentCardLink%/g, card.url)
                .trim());

            self.removeParent(checkParentRecursionCard);
          }

          // end check recursion

          // adding parent

          if (parent.childrenChecklist) {
            self.base.api.checklist.addItem(parent.childrenChecklist.id, '#' + card.idShort, 'bottom', function (checkItemData) {
              parent.childrenChecklist.checkItems.push(checkItemData);

              self.base.lockDOM('inheritance-add-parent', true);

              self.readCards();

              self.base.lockDOM('inheritance-add-parent', false);
            });
          } else {
            self.data.cardsWithWaitingChildrenChecklists.push(parent.id);

            self.base.api.checklist.create(parent.id, self.data.childrenName, 'top', function (checkListData) {
              self.base.api.checklist.addItem(checkListData.id, '#' + card.idShort, 'bottom', function (checkItemData) {
                parent.data.checklists.push(checkListData);
                parent.childrenChecklist = parent.data.checklists[parent.data.checklists.length - 1];
                parent.childrenChecklist.checkItems = [checkItemData];

                self.data.cardsWithWaitingChildrenChecklists.splice(self.data.cardsWithWaitingChildrenChecklists.indexOf(parent.id), 1);

                self.base.lockDOM('inheritance-add-parent', true);

                self.readCards();

                self.base.lockDOM('inheritance-add-parent', false);
              });
            });
          }

          // end adding parent
        }

        self.base.popOver(false);
      }
    },

    removeParent: function (card) {
      var self = this;

      if (typeof card !== 'undefined') {
        card.parent.childrenChecklist.checkItems.splice(card.parent.childrenChecklist.checkItems.indexOf(card.checkItem), 1);

        if (card.parent.childrenChecklist.checkItems.length) {
          self.base.api.checklist.deleteItem(card.parent.childrenChecklist.id, card.checkItem.id);
        } else {
          self.base.api.checklist.remove(card.parent.childrenChecklist.id);
          card.parent.data.checklists.splice(card.parent.data.checklists.indexOf(card.parent.childrenChecklist), 1);
          delete card.parent.childrenChecklist;
        }

        delete card.checkItem;
        delete card.parent;

        return true;
      }

      return false;
    },

    changeChildrenInCard: function (card) {
      var self = this;

      if (card.children && card.children.length) {
        for (var c = 0; c < card.children.length; c++) {
          var removedChild = card.children[c];

          delete removedChild.parent;
          delete removedChild.checkItem
        }
      }

      card.children = [];

      delete card.childrenChecklist;

      for (var i = 0; i < card.data.checklists.length; i++) {
        var checklist = card.data.checklists[i];

        if (checklist.name.trim().toLowerCase() === self.data.childrenName.trim().toLowerCase()) {
          if (!checklist.checkItems.length) {
            if (self.data.cardsWithWaitingChildrenChecklists.indexOf(card.id) < 0) {
              self.base.api.checklist.remove(checklist.id);
              card.data.checklists.splice(i, 1);

              if (typeof card.childrenChecklist !== 'undefined') {
                delete card.childrenChecklist;
              }
            }
          } else {
            card.childrenChecklist = checklist;

            for (var y = 0; y < checklist.checkItems.length; y++) {
              var checkItem = checklist.checkItems[y],
                  checkName = checkItem.name.trim(),
                  match = checkName.match(/#([0-9]+)/);

              if (match && match[0] === checkName && typeof self.base.data.cards[match[1]] !== 'undefined') {
                var childCard = self.base.data.cards[match[1]];

                var checkRecursionParent = self.checkRecursion(card, 'parent', childCard),
                    checkRecursionChildren = self.checkRecursion(childCard.parent, 'parent', card);

                if (card === childCard) {
                  console.warn(self.base.settings.notification.messages.recursionOnBoard
                      .replace(/%recursionCardTitle%/g, childCard.url)
                      .replace(/%recursionCardLink%/g, childCard.url)
                      .replace(/%currentCardTitle%/g, card.url)
                      .replace(/%currentCardLink%/g, card.url)
                      .replace(/<\/?[^>]+(>|$)/g, '')
                      .trim());

                  self.base.openNotification(self.base.settings.notification.messages.recursionOnBoard
                      .replace(/%recursionCardTitle%/g, '#' + childCard.idShort + ' ' + childCard.title)
                      .replace(/%recursionCardLink%/g, childCard.url)
                      .replace(/%currentCardTitle%/g, '#' + card.idShort + ' ' + card.title)
                      .replace(/%currentCardLink%/g, card.url)
                      .trim());
                }

                if (checkRecursionParent) {
                  console.warn(self.base.settings.notification.messages.recursionOnBoard
                      .replace(/%recursionCardTitle%/g, childCard.url)
                      .replace(/%recursionCardLink%/g, childCard.url)
                      .replace(/%currentCardTitle%/g, checkRecursionParent.url)
                      .replace(/%currentCardLink%/g, checkRecursionParent.url)
                      .replace(/<\/?[^>]+(>|$)/g, '')
                      .trim());

                  self.base.openNotification(self.base.settings.notification.messages.recursionOnBoard
                      .replace(/%recursionCardTitle%/g, '#' + childCard.idShort + ' ' + childCard.title)
                      .replace(/%recursionCardLink%/g, childCard.url)
                      .replace(/%currentCardTitle%/g, '#' + checkRecursionParent.idShort + ' ' + checkRecursionParent.title)
                      .replace(/%currentCardLink%/g, checkRecursionParent.url)
                      .trim());
                }

                if (checkRecursionChildren) {
                  console.warn(self.base.settings.notification.messages.recursionOnBoard
                      .replace(/%recursionCardTitle%/g, card.url)
                      .replace(/%recursionCardLink%/g, card.url)
                      .replace(/%currentCardTitle%/g, checkRecursionChildren.url)
                      .replace(/%currentCardLink%/g, checkRecursionChildren.url)
                      .replace(/<\/?[^>]+(>|$)/g, '')
                      .trim());

                  self.base.openNotification(self.base.settings.notification.messages.recursionOnBoard
                      .replace(/%recursionCardTitle%/g, '#' + card.idShort + ' ' + card.title)
                      .replace(/%recursionCardLink%/g, card.url)
                      .replace(/%currentCardTitle%/g, '#' + checkRecursionChildren.idShort + ' ' + checkRecursionChildren.title)
                      .replace(/%currentCardLink%/g, checkRecursionChildren.url)
                      .trim());
                }

                if (card.children.indexOf(childCard) > -1 || checkRecursionParent || checkRecursionChildren || card === childCard) {
                  checklist.checkItems.splice(y, 1);

                  if (typeof childCard.parent !== 'undefined') {
                    if (childCard.parent.children && childCard.parent.children.length && childCard.parent.children.lastIndexOf(childCard) > -1) {
                      childCard.parent.children.splice(childCard.parent.children.lastIndexOf(childCard), 1);
                    }

                    delete childCard.checkItem;
                    delete childCard.parent;
                  }

                  if (checklist.checkItems.length) {
                    self.base.api.checklist.deleteItem(checklist.id, checkItem.id);
                  } else {
                    self.base.api.checklist.remove(checklist.id);
                    card.data.checklists.splice(i, 1);
                    delete card.childrenChecklist;
                  }
                } else {
                  if (typeof childCard.parent !== 'undefined' && childCard.parent !== card && typeof childCard.parent.childrenChecklist !== 'undefined') {
                    var checkCheckItem = self.base.getElementByProperty(childCard.parent.childrenChecklist.checkItems, 'name', '#' + childCard.idShort);

                    if (checkCheckItem) {
                      console.warn(self.base.settings.notification.messages.severalParentsOnCard
                          .replace(/%recursionCardTitle%/g, childCard.url)
                          .replace(/%recursionCardLink%/g, childCard.url)
                          .replace(/%currentCardTitle%/g, childCard.parent.url)
                          .replace(/%currentCardLink%/g, childCard.parent.url)
                          .replace(/<\/?[^>]+(>|$)/g, '')
                          .trim());

                      self.base.openNotification(self.base.settings.notification.messages.severalParentsOnCard
                          .replace(/%recursionCardTitle%/g, '#' + childCard.idShort + ' ' + childCard.title)
                          .replace(/%recursionCardLink%/g, childCard.url)
                          .replace(/%currentCardTitle%/g, '#' + childCard.parent.idShort + ' ' + childCard.parent.title)
                          .replace(/%currentCardLink%/g, childCard.parent.url)
                          .trim());

                      self.removeParent(childCard);
                    }
                  }

                  childCard.checkItem = checkItem;
                  card.children.push(childCard);
                  childCard.parent = card;
                }
              } else if (self.data.cardsWithWaitingChildrenChecklists.indexOf(card.id) < 0) {
                if (checklist.checkItems.length === 1) {
                  self.base.api.checklist.remove(checklist.id);
                  card.data.checklists.splice(i, 1);
                  delete card.childrenChecklist;
                } else {
                  self.base.api.checklist.deleteItem(checklist.id, checkItem.id);
                  checklist.checkItems.splice(y, 1);
                }
              }
            }

            self.base.sortByProperty(card.children, 'checkItem.pos');
          }

          break;
        }
      }

      self.clearBadgeInCard(card);

      var openedCard = self.base.getCurrentOpenedCard();

      if (openedCard && (
              openedCard === card ||
              (openedCard.parent && openedCard.parent === card) ||
              self.checkRecursion(card, 'parent', openedCard) ||
              (card.parent && card.parent.children && card.parent.children.length && card.parent.children.indexOf(openedCard))
          )) {
        self.updateCardView(openedCard);
      }
    },

    openCardViewed: function (card) {
      var self = this;

      self.updateCardView(card);

      self.base.api.card.get(card.id, function (cardData) {
        card.data = cardData;

        self.parseCard(card);
      });
    },

    checkItemUpdated: function (_target) {
      var self = this;

      if (!_target) {
        return false;
      }

      var _checklist = self.base.findParentByClass(_target, 'checklist');

      if (_checklist && _checklist.querySelector('h3') && _checklist.querySelector('h3').innerHTML.trim().toLowerCase() === self.data.childrenName.toLowerCase()) {
        var openedCard = self.base.getCurrentOpenedCard();

        if (openedCard && openedCard.childrenChecklist) {
          self.base.api.checklist.get(openedCard.childrenChecklist.id, function (checklistData) {
            openedCard.childrenChecklist.checkItems = checklistData.checkItems;

            self.parseCard(openedCard);

            self.updateCardView();
          });
        }
      }
    },

    init: function () {
      var self = this;

      self.base.callbacks.cardsUpdated['inheritance'] = function () {
        self.readCards();
      };

      self.base.callbacks.openCardViewed['inheritance'] = function (card) {
        self.openCardViewed(card);
      };

      self.base.callbacks.checklistInserted['inheritance'] = function (_target) {
        if (_target.querySelector('h3') && _target.querySelector('h3').innerHTML.trim().toLowerCase() === self.data.childrenName.toLowerCase()) {
          _target.classList.add('hide');

          self.updateCardView();
        }
      };

      self.base.callbacks.checkItemUpdated['inheritance'] = function (_target) {
        self.checkItemUpdated(_target);
      };

      self.base.callbacks.badgeChecklistUpdated['inheritance'] = function (card) {
        self.parseCard(card);
      };
    }
  };

})();
