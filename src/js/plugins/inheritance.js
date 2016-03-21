(function () {
  'use strict';

  HandsomeTrello.plugins.inheritance = {
    base: {},

    data: {
      childrenName: 'Children',
      checkChildrenInterval: 0
    },

    parseCard: function (card) {
      var self = this;

      self.updateChildrenInCard(card);
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

      var _cardParent = document.querySelector('.js-card-parent');

      if (_cardParent) {
        self.base.removeElement(_cardParent);
      }

      if (typeof parentCard === 'undefined') {
        return;
      }

      return self.base.jsonToDOM(
          ['div', {
            'class': 'js-card-parent'
          },
            ['h3', {
              'class': 'card-detail-item-header'
            },
              'Parent:'
            ],
            ['p', {
              'class': 'handsome-trello__inheritance-parent handsome-trello__inheritance-parent--' + parentCard.status
            },
              ['a', {
                'href': parentCard.url,
                'class': 'handsome-trello__inheritance-link'
              },
                parentCard.title
              ],
              ' (' + (parentCard.status === 'closed' ? 'Archived' : parentCard.column.name) + ')'
            ]
          ]
      );
    },

    generateHtmlForOneChildren: function (children, level) {
      var self = this;

      var _ul = document.createElement('ul');
      _ul.setAttribute('class', 'handsome-trello__inheritance-children-list' + (level === 0 ? ' js-children-list' : ''));

      for (var i = 0; i < children.length; i++) {
        var childCard = children[i];

        if (typeof childCard !== 'undefined') {
          var liAttributes = {
            'class': 'handsome-trello__inheritance-children-item handsome-trello__inheritance-children-item--' + childCard.status
          };

          if (level === 0) {
            liAttributes['data-children-id'] = childCard.checkItem.id;
            liAttributes['data-children-pos'] = childCard.checkItem.pos;
          }

          _ul.appendChild(self.base.jsonToDOM(
              ['li', liAttributes,
                ['p', {
                  'class': 'handsome-trello__inheritance-children-name'
                },
                  ['a', {
                    'href': childCard.url,
                    'class': 'handsome-trello__inheritance-link'
                  },
                    childCard.title
                  ],
                  ' (' + (childCard.status === 'closed' ? 'Archived' : childCard.column.name) + ')'
                ],
                typeof childCard.children !== 'undefined' && childCard.children.length ?
                    self.generateHtmlForOneChildren(childCard.children, level + 1) :
                    ''
              ]
          ));
        }
      }

      return _ul;
    },

    generateHtmlForChildren: function (children) {
      var self = this;

      var _cardChildren = document.querySelector('.js-card-children');

      if (_cardChildren) {
        self.base.removeElement(_cardChildren);
      }

      if (typeof children === 'undefined' || !children.length) {
        return;
      }

      var _div = document.createElement('div'),
          _h3 = document.createElement('h3');

      _div.setAttribute('class', 'handsome-trello__inheritance-children js-card-children');
      _h3.setAttribute('class', 'handsome-trello__inheritance-children-title card-detail-item-header');
      _h3.textContent = 'Children:';

      _div.appendChild(_h3);
      _div.appendChild(self.generateHtmlForOneChildren(children, 0));

      return _div;
    },

    generateHtmlForRelatedTasks: function (card, parent) {
      var self = this;

      var _cardRelated = document.querySelector('.js-card-related');

      if (_cardRelated) {
        self.base.removeElement(_cardRelated);
      }

      if (
          typeof parent === 'undefined' ||
          typeof parent.children === 'undefined' || !parent.children.length ||
          (
              parent.children.length === 1 &&
              parent.children[0] === card
          )
      ) {
        return;
      }

      var _div = document.createElement('div'),
          _h3 = document.createElement('h3'),
          _ul = document.createElement('ul');

      _div.setAttribute('class', 'js-card-related');
      _h3.setAttribute('class', 'card-detail-item-header');
      _h3.textContent = 'Related:';
      _ul.setAttribute('class', 'handsome-trello__inheritance-related-list');

      for (var i = 0; i < parent.children.length; i++) {
        var relatedCard = parent.children[i];

        if (card !== relatedCard) {
          _ul.appendChild(self.base.jsonToDOM(
              ['li', {
                'class': 'handsome-trello__inheritance-related-item handsome-trello__inheritance-related-item--' + relatedCard.status
              },
                ['a', {
                  'href': relatedCard.url,
                  'class': 'handsome-trello__inheritance-link'
                },
                  relatedCard.title
                ],
                ' (' + (relatedCard.status === 'closed' ? 'Archived' : relatedCard.column.name) + ')'
              ]
          ));
        }
      }

      _div.appendChild(_h3);
      _div.appendChild(_ul);

      return _div;
    },

    searchInString: function (stringLine, searchLine) {
      var stringArray = stringLine.replace(/ +(?= )/g, '').replace(/[^0-9A-Za-zА-Яа-яЁё ]/g, '').trim().split(' '),
          searchArray = searchLine.replace(/ +(?= )/g, '').replace(/[^0-9A-Za-zА-Яа-яЁё ]/g, '').trim().split(' '),
          matchesCount = 0;

      for (var y = 0; y < searchArray.length; y++) {
        for (var i = 0; i < stringArray.length; i++) {
          if (
              (
                  y === searchArray.length - 1 &&
                  stringArray[i].indexOf(searchArray[y]) === 0
              ) ||
              stringArray[i].toLowerCase() == searchArray[y].toLowerCase()
          ) {
            matchesCount++;

            break;
          }
        }
      }

      return matchesCount === searchArray.length;
    },

    openParentChangePopOver: function (target) {
      var self = this;

      if (!self.base.checkPopOver('Set Parent')) {
        return false;
      }

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

      var popOverElements = self.base.popOver(true, 'Set Parent', self.base.jsonToDOM(['div', {},
            ['input', {
              'type': 'text',
              'placeholder': 'Search parent',
              'class': 'js-parent-change-search-field js-autofocus'
            }],
            ['ul', {
              'class': 'pop-over-card-list handsome-trello__inheritance-pop-over-parent-list checkable js-parent-change-list'
            }]
          ]), target),
          _popOverContent = popOverElements._popOverContent,
          _parentChangeSearchField = _popOverContent.querySelector('.js-parent-change-search-field'),
          _parentChangeList = _popOverContent.querySelector('.js-parent-change-list');

      generateCardsList();

      _parentChangeSearchField.focus();

      function generateCardsItem(card, parentIndex, active, selected) {
        return self.base.jsonToDOM(
            ['li', {
              'class': 'item js-parent-change-item' + (active ? ' active' : '') + (selected ? ' selected' : '')
            },
              ['a', {
                'href': '#',
                'title': card.title + ' (' + card.column.name + ')',
                'class': 'name js-parent-change-link',
                'data-parent-index': parentIndex
              },
                ['span', {
                  'class': 'full-name'
                },
                  card.title + ' ',
                  ['span', {
                    'class': 'handsome-trello__inheritance-pop-over-parent-column-name'
                  },
                    '(' + card.column.name + ')'
                  ]
                ],
                ['span', {
                  'class': 'icon-sm icon-check checked-icon'
                }]
              ]
            ]
        );
      }

      function generateCardsList() {
        if (currentQueryString === _parentChangeSearchField.value.trim()) {
          return false;
        }

        currentQueryString = _parentChangeSearchField.value.trim();

        _parentChangeList.innerHTML = '';

        if (_parentChangeSearchField && _parentChangeSearchField.value.trim().length) {
          currentItems = [];

          for (var cardId in self.base.data.cards) {
            var card = self.base.data.cards[cardId];

            if (
                card !== currentOpenedCard &&
                card.status !== 'closed' &&
                self.searchInString(card.title.toLowerCase(), _parentChangeSearchField.value.trim().toLowerCase())
            ) {
              _parentChangeList.appendChild(
                  generateCardsItem(
                      card,
                      currentItems.length,
                      (currentOpenedCard.parent && card.id === currentOpenedCard.parent.id),
                      !currentItems.length
                  )
              );

              currentItems.push(card);
            }
          }

          selectParentChangeItem(currentItems.length ? 0 : undefined, true);
        } else if (currentOpenedCard.parent) {
          currentItems = [currentOpenedCard.parent];

          _parentChangeList.appendChild(
              generateCardsItem(
                  currentOpenedCard.parent,
                  0,
                  currentParent && currentParent.id === currentOpenedCard.parent.id,
                  false
              )
          );

          selectParentChangeItem(undefined, true);
        }

        var _parentChangeLinks = _parentChangeList.querySelectorAll('.js-parent-change-link');

        for (var i = 0; i < _parentChangeLinks.length; i++) {
          _parentChangeLinks[i].addEventListener('mouseover', function (e) {
            selectParentChangeItem(parseInt(e.currentTarget.getAttribute('data-parent-index')), true);
          });

          _parentChangeLinks[i].addEventListener('click', function (e) {
            e.preventDefault();

            self.changeParent(currentOpenedCard, currentItems[parseInt(e.currentTarget.getAttribute('data-parent-index'))]);
          });
        }
      }

      function checkScrollMissing(_item, _list) {
        var listHeight = _list.offsetHeight,
            listOffsetTop = _list.offsetTop,
            listScrollTop = _list.scrollTop,
            itemHeight = _item.offsetHeight,
            itemOffsetTop = _item.offsetTop,
            itemPositionTop = itemOffsetTop - listOffsetTop;

        if (itemPositionTop < listScrollTop) {
          _list.scrollTop = itemPositionTop;
        } else if (itemPositionTop + itemHeight > listScrollTop + listHeight) {
          _list.scrollTop = itemPositionTop - listHeight + itemHeight;
        }
      }

      function selectParentChangeItem(index, notUndefined, checkMissingScroll) {
        if (typeof notUndefined === 'undefined') {
          notUndefined = false;
        }

        if (typeof checkMissingScroll === 'undefined') {
          checkMissingScroll = false;
        }

        var _parentChangeItems = _popOverContent.querySelectorAll('.js-parent-change-item');

        if (_parentChangeItems.length) {
          if (
              typeof selectedItemIndex !== 'undefined' &&
              typeof _parentChangeItems[selectedItemIndex] !== 'undefined' &&
              (!notUndefined || selectedItemIndex !== index)
          ) {
            _parentChangeItems[selectedItemIndex].classList.remove('selected');
          }

          if (
              typeof index !== 'undefined' &&
              typeof _parentChangeItems[index] !== 'undefined' &&
              selectedItemIndex !== index
          ) {
            _parentChangeItems[index].classList.add('selected');

            if (checkMissingScroll) {
              checkScrollMissing(_parentChangeItems[index], _parentChangeList);
            }
          }

          selectedItemIndex = selectedItemIndex !== index || notUndefined ? index : undefined;
        }
      }

      _parentChangeSearchField.addEventListener('keyup', function () {
        generateCardsList();

        self.base.updatePopOver();
      });

      _parentChangeSearchField.addEventListener('keydown', function (e) {
        if (
            e.keyCode === 13 && // Enter
            typeof selectedItemIndex !== 'undefined' &&
            typeof currentItems[selectedItemIndex] !== 'undefined'
        ) {
          self.changeParent(currentOpenedCard, currentItems[selectedItemIndex]);
        } else if (e.keyCode === 38) { // Arrow Up
          selectParentChangeItem(
              typeof selectedItemIndex !== 'undefined' && selectedItemIndex - 1 >= 0 ? selectedItemIndex - 1 : currentItems.length - 1,
              false,
              true
          );
        } else if (e.keyCode === 40) { // Arrow Down
          selectParentChangeItem(
              typeof selectedItemIndex !== 'undefined' && selectedItemIndex + 1 < currentItems.length ? selectedItemIndex + 1 : 0,
              false,
              true
          );
        }
      });
    },

    openChildrenPopOver: function (target) {
      var self = this;

      if (!self.base.checkPopOver('Add Child')) {
        return false;
      }

      var currentOpenedCard = self.base.getCurrentOpenedCard(),
          currentColumn = undefined,
          currentPosition = 'bottom',
          positionsList = [],
          columnsList = [];

      for (var k = 0; k < self.base.data.boardData.lists.length; k++) {
        var column = self.base.data.boardData.lists[k],
            isCurrentColumn = currentOpenedCard && column.name === currentOpenedCard.column.name;

        if (!currentColumn || isCurrentColumn) {
          currentColumn = column;
        }

        columnsList.push(self.base.jsonToDOM(
            ['option', {
              'value': column.id,
              'selected': (isCurrentColumn ? 'selected' : false)
            },
              column.name + (isCurrentColumn ? ' (current)' : '')
            ]
        ));
      }

      var popOverElements = self.base.popOver(true, 'Add Child', self.base.jsonToDOM(['div', {},
            ['div', {
              'class': 'form-grid'
            },
              ['input', {
                'type': 'text',
                'placeholder': 'Title',
                'class': 'js-children-create-title-field'
              }]
            ],
            ['div', {
              'class': 'form-grid'
            },
              ['div', {
                'class': 'button-link setting form-grid-child form-grid-child-threequarters'
              },
                ['span', {
                  'class': 'label'
                },
                  'List'
                ],
                ['span', {
                  'class': 'value js-children-create-current-column-value'
                },
                  currentColumn.name
                ],
                ['label', {},
                  'List'
                ],
                ['select', {
                  'class': 'js-children-create-columns-select'
                }]
              ],
              ['div', {
                'class': 'button-link setting form-grid-child form-grid-child-quarter'
              },
                ['span', {
                  'class': 'label'
                },
                  'Position'
                ],
                ['span', {
                  'class': 'value js-children-create-current-position-value'
                },
                  currentPosition
                ],
                ['label', {},
                  'Position'
                ],
                ['select', {
                  'class': 'js-children-create-positions-select'
                }]
              ]
            ],
            ['div', {
              'class': 'form-grid'
            },
              ['input', {
                'type': 'submit',
                'value': 'Create',
                'class': 'primary wide js-children-create-submit-btn'
              }],
              ['div', {
                'class': 'check-div handsome-trello__inheritance-pop-over-children-checkbox'
              },
                ['input', {
                  'type': 'checkbox',
                  'id': 'pop-over-children-checkbox',
                  'checked': (self.base.options.openChildCard ? 'checked' : false)
                }],
                ['label', {
                  'for': 'pop-over-children-checkbox'
                },
                  'Open Child Card'
                ]
              ]
            ]
          ]), target),
          _popOverContent = popOverElements._popOverContent,
          _childrenCreateTitleField = _popOverContent.querySelector('.js-children-create-title-field'),
          _childrenCreateCurrentColumnValue = _popOverContent.querySelector('.js-children-create-current-column-value'),
          _childrenCreateColumnsSelect = _popOverContent.querySelector('.js-children-create-columns-select'),
          _childrenCreateCurrentPositionValue = _popOverContent.querySelector('.js-children-create-current-position-value'),
          _childrenCreatePositionsSelect = _popOverContent.querySelector('.js-children-create-positions-select'),
          _childrenCreateSubmitBtn = _popOverContent.querySelector('.js-children-create-submit-btn');

      for (var l = 0; l < columnsList.length; l++) {
        _childrenCreateColumnsSelect.appendChild(columnsList[l]);
      }

      generatePositionsList();

      document.getElementById('pop-over-children-checkbox').addEventListener('change', function (e) {
        self.base.options.openChildCard = e.target.checked;
        self.base.saveSettings();
      });

      function generatePositionsList() {
        var prevCardPos = undefined;

        _childrenCreatePositionsSelect.innerHTML = '';

        positionsList = [];

        for (var i = 0; i < self.base.data.boardData.cards.length; i++) {
          var card = self.base.data.boardData.cards[i];

          if (card.idList === currentColumn.id && !card.closed) {
            var currentPos = (prevCardPos ? (card.pos + prevCardPos) / 2 : 'top');
            positionsList[currentPos] = Object.keys(positionsList).length + 1;

            var _option = document.createElement('option');
            _option.setAttribute('value', currentPos);
            _option.textContent = positionsList[currentPos];

            _childrenCreatePositionsSelect.appendChild(_option);

            prevCardPos = card.pos;
          }
        }

        positionsList['bottom'] = Object.keys(positionsList).length + 1;

        _childrenCreatePositionsSelect.appendChild(
            self.base.jsonToDOM(
                ['option', {
                  'value': 'bottom',
                  'selected': 'selected'
                },
                  positionsList['bottom']
                ]
            )
        );

        _childrenCreateCurrentPositionValue.textContent = Object.keys(positionsList).length;
      }

      function createNewCard() {
        if (_childrenCreateTitleField.value.trim().length) {
          self.base.api.card.create(
              _childrenCreateTitleField.value.trim(),
              _childrenCreateColumnsSelect.value,
              _childrenCreatePositionsSelect.value,
              function (cardData) {
                cardData.checklists = [];

                self.base.data.boardData.cards.push(cardData);

                self.base.waitCreatingCard(cardData.shortUrl, function (card) {
                  if (typeof currentOpenedCard.children !== 'undefined' && currentOpenedCard.children.length) {
                    self.base.api.checklist.addItem(
                        currentOpenedCard.childrenChecklist.id,
                        cardData.url,
                        'bottom',
                        function (checkItemData) {
                          currentOpenedCard.childrenChecklist.checkItems.push(checkItemData);

                          self.base.lockDOM('inheritance-create-new-card', true);

                          self.readCards();

                          self.base.lockDOM('inheritance-create-new-card', false);

                          if (self.base.options.openChildCard) {
                            self.base.goToLink(cardData.url);
                          }
                        }
                    );
                  } else {
                    self.base.api.checklist.create(currentOpenedCard.id, self.data.childrenName, 'top', function (checkListData) {
                      self.base.api.checklist.addItem(checkListData.id, cardData.url, 'bottom', function (checkItemData) {
                        checkListData.checkItems = [checkItemData];
                        currentOpenedCard.data.checklists.push(checkListData);
                        currentOpenedCard.childrenChecklist =
                            currentOpenedCard.data.checklists[currentOpenedCard.data.checklists.length - 1];

                        self.base.lockDOM('inheritance-create-new-card', true);

                        self.readCards();

                        self.base.lockDOM('inheritance-create-new-card', false);

                        if (self.base.options.openChildCard) {
                          self.base.goToLink(cardData.url);
                        }
                      });
                    });
                  }
                });
              }
          );

          self.base.popOver(false);
        }
      }

      _childrenCreateTitleField.focus();

      _childrenCreateColumnsSelect.addEventListener('change', function () {
        currentColumn = self.base.getElementByProperty(self.base.data.boardData.lists, 'id', this.value);
        _childrenCreateCurrentColumnValue.textContent = currentColumn.name;

        generatePositionsList();
      });

      _childrenCreatePositionsSelect.addEventListener('change', function () {
        _childrenCreateCurrentPositionValue.textContent = positionsList[this.value];
      });

      _childrenCreateSubmitBtn.addEventListener('click', function () {
        createNewCard();
      });

      _childrenCreateTitleField.addEventListener('keydown', function (e) {
        if (e.keyCode === 13) {
          createNewCard();
        }
      });
    },

    addButtonsOnRightSidebar: function () {
      var self = this;

      var _sidebarButtonsList = document.querySelector('.window-sidebar .window-module div');

      if (!_sidebarButtonsList || !self.base.data.boardAccess) {
        return false;
      }

      var _sidebarParentBtn = _sidebarButtonsList.querySelector('.js-sidebar-parent-btn'),
          _sidebarChildBtn = _sidebarButtonsList.querySelector('.js-sidebar-child-btn');

      if (_sidebarParentBtn && _sidebarChildBtn) {
        return false;
      }

      if (_sidebarParentBtn) {
        self.base.removeElement(_sidebarParentBtn);
      }

      if (_sidebarChildBtn) {
        self.base.removeElement(_sidebarChildBtn);
      }

      _sidebarParentBtn = self.base.jsonToDOM(
          ['a', {
            'href': '#',
            'class': 'button-link js-sidebar-parent-btn'
          },
            ' ',
            ['span', {
              'class': 'icon-sm handsome-icon-parent'
            }],
            ' Parent'
          ]
      );
      _sidebarChildBtn = self.base.jsonToDOM(
          ['a', {
            'href': '#',
            'class': 'button-link js-sidebar-child-btn'
          },
            ' ',
            ['span', {
              'class': 'icon-sm handsome-icon-child'
            }],
            ' Child'
          ]
      );
      _sidebarButtonsList.appendChild(_sidebarParentBtn);
      _sidebarButtonsList.appendChild(_sidebarChildBtn);

      _sidebarParentBtn.addEventListener('click', function (e) {
        e.preventDefault();

        self.openParentChangePopOver(e.currentTarget);
      });

      _sidebarChildBtn.addEventListener('click', function (e) {
        e.preventDefault();

        self.openChildrenPopOver(e.currentTarget);
      });

      self.base.triggerResize();
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
              checkItemId = ui.item.attr('data-children-id'),
              newPosition =
                  !$prevItem.length || !$prevItem.attr('data-children-pos').length ? 'top' :
                      !$nextItem.length || !$nextItem.attr('data-children-pos').length ? 'bottom' :
                      (parseInt($prevItem.attr('data-children-pos')) + parseInt($nextItem.attr('data-children-pos'))) / 2;

          self.base.api.checklist.posItem(card.id, card.childrenChecklist.id, checkItemId, newPosition, function (data) {
            if (data && typeof data.pos !== 'undefined') {
              self.base.getElementByProperty(card.childrenChecklist.checkItems, 'id', checkItemId).pos = data.pos;
              self.base.sortByProperty(card.children, 'checkItem.pos');
              ui.item.attr('data-children-pos', data.pos);
            }
          });
        }
      })
    },

    updateInheritanceListInOpenedCardView: function (card) {
      var self = this;

      if (card) {
        var _descParentElement = document.querySelector('[attr="desc"]');

        self.base.prependElement(self.generateHtmlForChildren(card.children), _descParentElement);
        self.base.prependElement(self.generateHtmlForRelatedTasks(card, card.parent), _descParentElement);
        self.base.prependElement(self.generateHtmlForParent(card.parent), _descParentElement);

        self.bindDragAndDropOnChildren(card);
      }
    },

    updateCardView: function (card) {
      var self = this;

      if (typeof card === 'undefined') {
        card = self.base.getCurrentOpenedCard();
      }

      if (card && (card.status !== 'closed' || self.base.options.showArchivedCards)) {
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
        _checklistFakeBadge = _checklistBadge.cloneNode(true);
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
          _checklistFakeBadge.querySelector('.badge-text').textContent = countCompleteCheckItems + '/' + countCheckItems;
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
            console.warn(
                self.base.settings.notification.messages.recursionOnBoard(
                    '#' + checkParentRecursionCard.idShort + ' ' + checkParentRecursionCard.title,
                    checkParentRecursionCard.url,
                    '#' + card.idShort + ' ' + card.title,
                    card.url
                ).outerHTML.replace(/<\/?[^>]+(>|$)/g, '')
            );

            self.base.openNotification(
                self.base.settings.notification.messages.recursionOnBoard(
                    '#' + checkParentRecursionCard.idShort + ' ' + checkParentRecursionCard.title,
                    checkParentRecursionCard.url,
                    '#' + card.idShort + ' ' + card.title,
                    card.url
                )
            );

            self.removeParent(checkParentRecursionCard);
          }

          // end check recursion

          // adding parent

          if (parent.childrenChecklist) {
            self.base.api.checklist.addItem(parent.childrenChecklist.id, card.url, 'bottom', function (checkItemData) {
              parent.childrenChecklist.checkItems.push(checkItemData);

              self.base.lockDOM('inheritance-add-parent', true);

              self.readCards();

              self.base.lockDOM('inheritance-add-parent', false);
            });
          } else {
            self.base.api.checklist.create(parent.id, self.data.childrenName, 'top', function (checkListData) {
              self.base.api.checklist.addItem(checkListData.id, card.url, 'bottom', function (checkItemData) {
                parent.data.checklists.push(checkListData);
                parent.childrenChecklist = parent.data.checklists[parent.data.checklists.length - 1];
                parent.childrenChecklist.checkItems = [checkItemData];

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
        card.parent.children.splice(card.parent.children.indexOf(card), 1);

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

    checkValidationChildCheckItem: function (checkItemName) {
      var self = this;

      var cardIdMatch = checkItemName.match(self.base.data.regexp.cardId),
          cardLinkMatch = checkItemName.match(self.base.data.regexp.cardIdFromLink);

      if (cardIdMatch && cardIdMatch[0] === checkItemName && typeof self.base.data.cards[cardIdMatch[1]] !== 'undefined') {
        return self.base.data.cards[cardIdMatch[1]];
      } else if (cardLinkMatch && typeof self.base.data.cards[cardLinkMatch[1]] !== 'undefined') {
        return self.base.data.cards[cardLinkMatch[1]];
      }

      return false;
    },

    moveFromSecondChildrenChecklistToFirst: function (card, checklist) {
      var self = this;

      if (checklist.checkItems.length) {
        for (var z = 0; z < checklist.checkItems.length; z++) {
          var movingCheckItemName = checklist.checkItems[z].name.trim(),
              movingCard = self.checkValidationChildCheckItem(movingCheckItemName);

          if (movingCard) {
            if (card.children.indexOf(movingCard) < 0) {
              self.base.api.checklist.addItem(card.childrenChecklist.id, movingCheckItemName, 'bottom', function (checkItemData) {
                card.childrenChecklist.checkItems.push(checkItemData);

                self.base.lockDOM('inheritance-move-children-cards-to-other-children-list', true);

                self.readCards();

                self.base.lockDOM('inheritance-move-children-cards-to-other-children-list', false);
              });
            }
          }
        }
      }

      self.base.api.checklist.remove(checklist.id);
      card.data.checklists.splice(i, 1);
    },

    updateChildrenInCard: function (card) {
      var self = this;

      if (card.children && card.children.length) {
        for (var c = 0; c < card.children.length; c++) {
          var removedChild = card.children[c];

          delete removedChild.parent;
          delete removedChild.checkItem;
        }
      }

      card.children = [];

      delete card.childrenChecklist;

      for (var i = 0; i < card.data.checklists.length; i++) {
        var checklist = card.data.checklists[i];

        if (checklist.name.trim().toLowerCase() === self.data.childrenName.trim().toLowerCase()) {
          if (typeof card.childrenChecklist !== 'undefined') {
            if (!self.base.data.init) {
              self.moveFromSecondChildrenChecklistToFirst(card, checklist);
            }

            continue;
          }

          if (!checklist.checkItems.length) {
            if (!self.base.data.init) {
              self.base.api.checklist.remove(checklist.id);
              card.data.checklists.splice(i, 1);
            }
          } else {
            card.childrenChecklist = checklist;

            for (var y = 0; y < checklist.checkItems.length; y++) {
              var checkItem = checklist.checkItems[y],
                  checkItemName = checkItem.name.trim(),
                  checkItemCard = self.checkValidationChildCheckItem(checkItemName);

              if (checkItemCard) {
                var childCard = checkItemCard;

                if (childCard.status === 'closed' && !self.base.options.showArchivedCards) {
                  continue;
                }

                var checkRecursionParent = self.checkRecursion(card, 'parent', childCard),
                    checkRecursionChildren = self.checkRecursion(childCard.parent, 'parent', card);

                if (card.id === childCard.id) {
                  console.warn(
                      self.base.settings.notification.messages.recursionOnBoard(
                          '#' + childCard.idShort + ' ' + childCard.title,
                          childCard.url,
                          '#' + card.idShort + ' ' + card.title,
                          card.url
                      ).outerHTML.replace(/<\/?[^>]+(>|$)/g, '')
                  );

                  self.base.openNotification(
                      self.base.settings.notification.messages.recursionOnBoard(
                          '#' + childCard.idShort + ' ' + childCard.title,
                          childCard.url,
                          '#' + card.idShort + ' ' + card.title,
                          card.url
                      )
                  );
                }

                if (checkRecursionParent) {
                  console.warn(
                      self.base.settings.notification.messages.recursionOnBoard(
                          '#' + childCard.idShort + ' ' + childCard.title,
                          childCard.url,
                          '#' + checkRecursionParent.idShort + ' ' + checkRecursionParent.title,
                          checkRecursionParent.url
                      ).outerHTML.replace(/<\/?[^>]+(>|$)/g, '')
                  );

                  self.base.openNotification(
                      self.base.settings.notification.messages.recursionOnBoard(
                          '#' + childCard.idShort + ' ' + childCard.title,
                          childCard.url,
                          '#' + checkRecursionParent.idShort + ' ' + checkRecursionParent.title,
                          checkRecursionParent.url
                      )
                  );
                }

                if (checkRecursionChildren) {
                  console.warn(
                      self.base.settings.notification.messages.recursionOnBoard(
                          '#' + card.idShort + ' ' + card.title,
                          card.url,
                          '#' + checkRecursionChildren.idShort + ' ' + checkRecursionChildren.title,
                          checkRecursionChildren.url
                      ).outerHTML.replace(/<\/?[^>]+(>|$)/g, '')
                  );

                  self.base.openNotification(
                      self.base.settings.notification.messages.recursionOnBoard(
                          '#' + card.idShort + ' ' + card.title,
                          card.url,
                          '#' + checkRecursionChildren.idShort + ' ' + checkRecursionChildren.title,
                          checkRecursionChildren.url
                      )
                  );
                }

                if (card.children.indexOf(childCard) > -1 || checkRecursionParent || checkRecursionChildren || card.id === childCard.id) {
                  checklist.checkItems.splice(y, 1);

                  if (typeof childCard.parent !== 'undefined') {
                    if (
                        childCard.parent.children &&
                        childCard.parent.children.length &&
                        childCard.parent.children.lastIndexOf(childCard) > -1
                    ) {
                      childCard.parent.children.splice(childCard.parent.children.lastIndexOf(childCard), 1);
                    }

                    delete childCard.checkItem;
                    delete childCard.parent;
                  }

                  self.base.api.checklist.deleteItem(checklist.id, checkItem.id);
                } else {
                  if (
                      typeof childCard.parent !== 'undefined' &&
                      childCard.parent.id !== card.id &&
                      typeof childCard.parent.childrenChecklist !== 'undefined'
                  ) {
                    var checkCheckItem = self.base.getElementByProperty(
                        childCard.parent.childrenChecklist.checkItems,
                        'name',
                        childCard.url
                    );

                    if (!checkCheckItem) {
                      self.base.getElementByProperty(childCard.parent.childrenChecklist.checkItems, 'name', '#' + childCard.idShort);
                    }

                    if (checkCheckItem) {
                      console.warn(
                          self.base.settings.notification.messages.severalParentsOnCard(
                              '#' + childCard.idShort + ' ' + childCard.title,
                              childCard.url,
                              '#' + childCard.parent.idShort + ' ' + childCard.parent.title,
                              childCard.parent.url
                          ).outerHTML.replace(/<\/?[^>]+(>|$)/g, ''));

                      self.base.openNotification(
                          self.base.settings.notification.messages.severalParentsOnCard(
                              '#' + childCard.idShort + ' ' + childCard.title,
                              childCard.url,
                              '#' + childCard.parent.idShort + ' ' + childCard.parent.title,
                              childCard.parent.url
                          )
                      );

                      self.removeParent(childCard);
                    }
                  }

                  childCard.checkItem = checkItem;
                  card.children.push(childCard);
                  childCard.parent = card;
                }
              } else if (!self.base.data.init) {
                self.base.api.checklist.deleteItem(checklist.id, checkItem.id);
                checklist.checkItems.splice(y, 1);
              }
            }

            self.base.sortByProperty(card.children, 'checkItem.pos');
          }
        }
      }

      self.clearBadgeInCard(card);

      var openedCard = self.base.getCurrentOpenedCard();

      if (openedCard && (
              openedCard.id === card.id ||
              (openedCard.parent && openedCard.parent.id === card.id) ||
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

      if (
          _checklist &&
          _checklist.querySelector('h3') &&
          _checklist.querySelector('h3').textContent.trim().toLowerCase() === self.data.childrenName.toLowerCase()
      ) {
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
        if (
            _target.querySelector('h3') &&
            _target.querySelector('h3').textContent.trim().toLowerCase() === self.data.childrenName.toLowerCase()
        ) {
          _target.classList.add('hide');

          self.updateCardView();
        }
      };

      self.base.callbacks.checkItemUpdated['inheritance'] = function (_target) {
        self.checkItemUpdated(_target);
      };

      self.base.callbacks.badgeChecklistUpdated['inheritance'] = function (card) {
        self.parseCard(card);

        self.updateCardView();
      };
    }
  };

})();
