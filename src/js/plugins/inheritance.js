(function () {
  'use strict';

  HandsomeTrello.plugins.inheritance = {
    base: {},

    data: {
      childrenName: 'Children',
      checkChildrenInterval: 0,
      parentsLoading: [],
      childrenLoading: []
    },

    parseCard: function (card) {
      this.updateChildrenInCard(card);
    },

    readCards: function () {
      HandsomeTrello.helpers.lockDOM('inheritance-read-cards', true);

      for (var cardId in HandsomeTrello.data.cards) {
        this.parseCard(HandsomeTrello.data.cards[cardId]);
      }

      this.updateCardView();

      HandsomeTrello.helpers.lockDOM('inheritance-read-cards', false);
    },

    checkParentLoading: function (id) {
      return this.data.parentsLoading.indexOf(id) > -1;
    },

    parentLoading: function (id, status) {
      if (typeof status === 'undefined' || status) {
        if (this.data.parentsLoading.indexOf(id) < 0) {
          this.data.parentsLoading.push(id);

          HandsomeTrello.helpers.initEvent('handsomeTrello.parentLoading', {
            id: id,
            status: true
          });
        }
      } else {
        if (this.data.parentsLoading.indexOf(id) > -1) {
          this.data.parentsLoading.splice(this.data.parentsLoading.indexOf(id), 1);

          HandsomeTrello.helpers.initEvent('handsomeTrello.parentLoading', {
            id: id,
            status: false
          });
        }
      }
    },

    checkChildLoading: function (id) {
      return this.data.childrenLoading.indexOf(id) > -1;
    },

    childLoading: function (id, status) {
      if (typeof status === 'undefined' || status) {
        if (this.data.childrenLoading.indexOf(id) < 0) {
          this.data.childrenLoading.push(id);

          HandsomeTrello.helpers.initEvent('handsomeTrello.childrenLoading', {
            id: id,
            status: false
          });
        }
      } else {
        if (this.data.childrenLoading.indexOf(id) > -1) {
          this.data.childrenLoading.splice(this.data.childrenLoading.indexOf(id), 1);

          HandsomeTrello.helpers.initEvent('handsomeTrello.childrenLoading', {
            id: id,
            status: false
          });
        }
      }
    },

    generateHtmlForParent: function (parentCard) {
      var _cardParent = document.querySelector('.js-card-parent');

      if (_cardParent) {
        HandsomeTrello.helpers.removeElement(_cardParent);
      }

      if (!parentCard) {
        return;
      }

      return HandsomeTrello.helpers.jsonToDOM(
          ['div', {
            'class': 'handsome-trello__inheritance-parent handsome-trello__inheritance-parent--' + HandsomeTrello.options.descriptionPosition + ' js-card-parent'
          },
            ['h3', {
              'class': 'card-detail-item-header'
            },
              'Parent:'
            ],
            ['p', {
              'class': 'handsome-trello__inheritance-parent-item handsome-trello__inheritance-parent-item--' + parentCard.status
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
      var _ul = document.createElement('ul');
      _ul.setAttribute('class', 'handsome-trello__inheritance-children-list' + (level === 0 ? ' js-children-list' : ''));

      for (var i = 0; i < children.length; i++) {
        var childCard = children[i];

        if (childCard) {
          var liAttributes = {
            'class': 'handsome-trello__inheritance-children-item handsome-trello__inheritance-children-item--' + childCard.status
          };

          if (level === 0) {
            liAttributes['data-children-id'] = childCard.checkItem.id;
            liAttributes['data-children-pos'] = childCard.checkItem.pos;
          }

          _ul.appendChild(HandsomeTrello.helpers.jsonToDOM(
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
                childCard.children && childCard.children.length ?
                    this.generateHtmlForOneChildren(childCard.children, level + 1) :
                    ''
              ]
          ));
        }
      }

      return _ul;
    },

    generateHtmlForChildren: function (children) {
      var _cardChildren = document.querySelector('.js-card-children');

      if (_cardChildren) {
        HandsomeTrello.helpers.removeElement(_cardChildren);
      }

      if (!children || !children.length) {
        return;
      }

      var _div = document.createElement('div'),
          _h3 = document.createElement('h3');

      _div.setAttribute('class', 'handsome-trello__inheritance-children handsome-trello__inheritance-children--' + HandsomeTrello.options.descriptionPosition + ' js-card-children');
      _h3.setAttribute('class', 'handsome-trello__inheritance-children-title card-detail-item-header');
      _h3.textContent = 'Children:';

      _div.appendChild(_h3);
      _div.appendChild(this.generateHtmlForOneChildren(children, 0));

      return _div;
    },

    generateHtmlForRelatedTasks: function (card, parent) {
      var _cardRelated = document.querySelector('.js-card-related');

      if (_cardRelated) {
        HandsomeTrello.helpers.removeElement(_cardRelated);
      }

      if (
          !parent || !parent.children || !parent.children.length ||
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

      _div.setAttribute('class', 'handsome-trello__inheritance-related handsome-trello__inheritance-related--' + HandsomeTrello.options.descriptionPosition + ' js-card-related');
      _h3.setAttribute('class', 'card-detail-item-header');
      _h3.textContent = 'Siblings:';
      _ul.setAttribute('class', 'handsome-trello__inheritance-related-list');

      for (var i = 0; i < parent.children.length; i++) {
        var relatedCard = parent.children[i];

        if (card !== relatedCard) {
          _ul.appendChild(HandsomeTrello.helpers.jsonToDOM(
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

    openParentChangePopOver: function (_target, close) {
      var self = this;

      if (typeof close === 'undefined') {
        close = false;
      }

      var _popOverContent,
          _parentChangeSearchField,
          _parentChangeList;

      var currentOpenedCard = HandsomeTrello.getCurrentOpenedCard();

      if (!currentOpenedCard) {
        return false;
      }

      var currentParent,
          currentItems = [],
          currentQueryString = null,
          selectedItemIndex = null;

      if (!HandsomeTrello.popOver.check('Set Parent', close)) {
        _popOverContent = document.querySelector('.js-pop-over-content');

        if (_popOverContent) {
          _parentChangeSearchField = _popOverContent.querySelector('.js-parent-change-search-field');
          _parentChangeList = _popOverContent.querySelector('.js-parent-change-list');

          generateCardsList();
        }

        return false;
      }

      if (!_target) {
        return false;
      }

      if (currentOpenedCard.parent) {
        currentParent = {
          id: currentOpenedCard.parent.id,
          title: currentOpenedCard.parent.title
        };
      }

      var popOverElements = HandsomeTrello.popOver.open('Set Parent', HandsomeTrello.helpers.jsonToDOM(['div', {},
        ['input', {
          'type': 'text',
          'placeholder': 'Search parent',
          'class': 'js-parent-change-search-field js-autofocus'
        }],
        ['ul', {
          'class': 'pop-over-card-list handsome-trello__inheritance-pop-over-parent-list checkable js-parent-change-list'
        }]
      ]), _target);

      _popOverContent = popOverElements._popOverContent;
      _parentChangeSearchField = _popOverContent.querySelector('.js-parent-change-search-field');
      _parentChangeList = _popOverContent.querySelector('.js-parent-change-list');

      if (self.checkParentLoading(currentOpenedCard.id)) {
        _popOverContent.classList.add('pop-over-content--loading');
        _parentChangeSearchField.setAttribute('disabled', 'disabled');
      } else {
        generateCardsList();

        _parentChangeSearchField.focus();
      }

      function generateCardsItem(card, parentIndex, active, selected) {
        return HandsomeTrello.helpers.jsonToDOM(
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

          for (var cardId in HandsomeTrello.data.cards) {
            var card = HandsomeTrello.data.cards[cardId];

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

          selectParentChangeItem(currentItems.length ? 0 : null, true);
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

          selectParentChangeItem(null, true);
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
              typeof selectedItemIndex === 'number' &&
              typeof _parentChangeItems[selectedItemIndex] === 'object' &&
              (!notUndefined || selectedItemIndex !== index)
          ) {
            _parentChangeItems[selectedItemIndex].classList.remove('selected');
          }

          if (
              typeof index === 'number' &&
              typeof _parentChangeItems[index] === 'object' &&
              selectedItemIndex !== index
          ) {
            _parentChangeItems[index].classList.add('selected');

            if (checkMissingScroll) {
              checkScrollMissing(_parentChangeItems[index], _parentChangeList);
            }
          }

          selectedItemIndex = selectedItemIndex !== index || notUndefined ? index : null;
        }
      }

      _parentChangeSearchField.addEventListener('keyup', function () {
        generateCardsList();

        HandsomeTrello.popOver.update();
      });

      _parentChangeSearchField.addEventListener('keydown', function (e) {
        if (
            e.keyCode === 13 && // Enter
            typeof selectedItemIndex === 'number' &&
            currentItems[selectedItemIndex]
        ) {
          self.changeParent(currentOpenedCard, currentItems[selectedItemIndex]);
        } else if (e.keyCode === 38) { // Arrow Up
          selectParentChangeItem(
              typeof selectedItemIndex === 'number' && selectedItemIndex - 1 >= 0 ? selectedItemIndex - 1 : currentItems.length - 1,
              false,
              true
          );
        } else if (e.keyCode === 40) { // Arrow Down
          selectParentChangeItem(
              typeof selectedItemIndex === 'number' && selectedItemIndex + 1 < currentItems.length ? selectedItemIndex + 1 : 0,
              false,
              true
          );
        }
      });
    },

    openChildrenPopOver: function (_target) {
      var self = this;

      if (!HandsomeTrello.popOver.check('Add Child', true)) {
        return false;
      }

      var currentOpenedCard = HandsomeTrello.getCurrentOpenedCard(),
          currentColumn = null,
          currentPosition = 'bottom',
          positionsList = [],
          columnsList = [];

      for (var k = 0; k < HandsomeTrello.data.boardData.lists.length; k++) {
        var column = HandsomeTrello.data.boardData.lists[k],
            isCurrentColumn = currentOpenedCard && column.name === currentOpenedCard.column.name;

        if (!currentColumn || isCurrentColumn) {
          currentColumn = column;
        }

        var optionParams = {
          'value': column.id
        };
        if (isCurrentColumn) {
          optionParams['selected'] = 'selected';
        }

        columnsList.push(HandsomeTrello.helpers.jsonToDOM(
            ['option', optionParams,
              column.name + (isCurrentColumn ? ' (current)' : '')
            ]
        ));
      }

      var openChildCheckboxAttributes = {
        'type': 'checkbox',
        'id': 'pop-over-children-checkbox'
      };

      if (HandsomeTrello.options.openChildCard) {
        openChildCheckboxAttributes['checked'] = 'checked';
      }

      var popOverElements = HandsomeTrello.popOver.open('Add Child', HandsomeTrello.helpers.jsonToDOM(['div', {},
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
                ['input', openChildCheckboxAttributes],
                ['label', {
                  'for': 'pop-over-children-checkbox'
                },
                  'Open Child Card'
                ]
              ]
            ]
          ]), _target),
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
        HandsomeTrello.options.openChildCard = e.target.checked;
        HandsomeTrello.saveSettings();
      });

      function generatePositionsList() {
        var prevCardPos = null;

        _childrenCreatePositionsSelect.innerHTML = '';

        positionsList = [];

        for (var i = 0; i < HandsomeTrello.data.boardData.cards.length; i++) {
          var card = HandsomeTrello.data.boardData.cards[i];

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
          HandsomeTrello.helpers.jsonToDOM(
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

      function createNewCard(currentOpenedCard) {
        if (_childrenCreateTitleField.value.trim().length) {
          self.childLoading(currentOpenedCard.id, true);

          HandsomeTrello.api.card.create(
              _childrenCreateTitleField.value.trim(),
              _childrenCreateColumnsSelect.value,
              _childrenCreatePositionsSelect.value,
              function (error, cardData) {
                if (error) {
                  HandsomeTrello.notification.open(
                    HandsomeTrello.settings.notification.messages.error('Request Error. Please, try again.')
                  );

                  self.childLoading(currentOpenedCard.id, false);
                } else {

                  cardData.checklists = [];

                  HandsomeTrello.data.boardData.cards.push(cardData);

                  HandsomeTrello.waitCreatingCard(cardData.shortUrl, function (card) {
                    if (currentOpenedCard.children && currentOpenedCard.children.length) {
                      HandsomeTrello.api.checklist.addItem(
                        currentOpenedCard.childrenChecklist.id,
                        cardData.url,
                        'bottom',
                        function (error, checkItemData) {
                          if (error) {
                            HandsomeTrello.notification.open(
                              HandsomeTrello.settings.notification.messages.error('Request Error. Please, try again.')
                            );

                            self.childLoading(currentOpenedCard.id, false);
                          } else {
                            currentOpenedCard.childrenChecklist.checkItems.push(checkItemData);

                            HandsomeTrello.helpers.lockDOM('inheritance-create-new-card', true);

                            self.readCards();

                            HandsomeTrello.helpers.lockDOM('inheritance-create-new-card', false);

                            self.childLoading(currentOpenedCard.id, false);

                            if (HandsomeTrello.options.openChildCard) {
                              HandsomeTrello.helpers.goToLink(cardData.url);
                            }
                          }
                        }
                      );
                    } else {
                      HandsomeTrello.api.checklist.create(currentOpenedCard.id, self.data.childrenName, 'top', function (error, checkListData) {
                        if (error) {
                          HandsomeTrello.notification.open(
                            HandsomeTrello.settings.notification.messages.error('Request Error. Please, try again.')
                          );

                          self.childLoading(currentOpenedCard.id, false);
                        } else {
                          HandsomeTrello.api.checklist.addItem(checkListData.id, cardData.url, 'bottom', function (error, checkItemData) {
                            if (error) {
                              HandsomeTrello.notification.open(
                                HandsomeTrello.settings.notification.messages.error('Request Error. Please, try again.')
                              );

                              self.childLoading(currentOpenedCard.id, false);
                            } else {
                              checkListData.checkItems = [checkItemData];
                              currentOpenedCard.data.checklists.push(checkListData);
                              currentOpenedCard.childrenChecklist =
                                currentOpenedCard.data.checklists[currentOpenedCard.data.checklists.length - 1];

                              HandsomeTrello.helpers.lockDOM('inheritance-create-new-card', true);

                              self.readCards();

                              HandsomeTrello.helpers.lockDOM('inheritance-create-new-card', false);

                              self.childLoading(currentOpenedCard.id, false);

                              if (HandsomeTrello.options.openChildCard) {
                                HandsomeTrello.helpers.goToLink(cardData.url);
                              }
                            }
                          });
                        }
                      });
                    }
                  });
                }
              }
          );

          HandsomeTrello.popOver.close();
        }
      }

      if (self.checkChildLoading(currentOpenedCard.id)) {
        _popOverContent.classList.add('pop-over-content--loading');
        _childrenCreateTitleField.setAttribute('disabled', 'disabled');
        _childrenCreateSubmitBtn.setAttribute('disabled', 'disabled');
      } else {
        _childrenCreateTitleField.focus();
      }

      _childrenCreateColumnsSelect.addEventListener('change', function () {
        currentColumn = HandsomeTrello.helpers.getElementByProperty(HandsomeTrello.data.boardData.lists, 'id', this.value);
        _childrenCreateCurrentColumnValue.textContent = currentColumn.name;

        generatePositionsList();
      });

      _childrenCreatePositionsSelect.addEventListener('change', function () {
        _childrenCreateCurrentPositionValue.textContent = positionsList[this.value];
      });

      _childrenCreateSubmitBtn.addEventListener('click', function () {
        createNewCard(currentOpenedCard);
      });

      _childrenCreateTitleField.addEventListener('keydown', function (e) {
        if (e.keyCode === 13) {
          createNewCard(currentOpenedCard);
        }
      });
    },

    addButtonsOnRightSidebar: function () {
      var self = this;

      var _sidebarButtonsList = document.querySelector('.window-sidebar .window-module div');

      if (!_sidebarButtonsList || !HandsomeTrello.data.boardAccess) {
        return false;
      }

      var _sidebarParentBtn = _sidebarButtonsList.querySelector('.js-sidebar-parent-btn'),
          _sidebarChildBtn = _sidebarButtonsList.querySelector('.js-sidebar-child-btn');

      if (_sidebarParentBtn && _sidebarChildBtn) {
        return false;
      }

      if (_sidebarParentBtn) {
        HandsomeTrello.helpers.removeElement(_sidebarParentBtn);
      }

      if (_sidebarChildBtn) {
        HandsomeTrello.helpers.removeElement(_sidebarChildBtn);
      }

      _sidebarParentBtn = HandsomeTrello.helpers.jsonToDOM(
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
      _sidebarChildBtn = HandsomeTrello.helpers.jsonToDOM(
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

        self.openParentChangePopOver(e.currentTarget, true);
      });

      _sidebarChildBtn.addEventListener('click', function (e) {
        e.preventDefault();

        self.openChildrenPopOver(e.currentTarget);
      });

      HandsomeTrello.helpers.triggerResize();
    },

    bindDragAndDropOnChildren: function (card) {
      if (!card.childrenChecklist || !HandsomeTrello.data.boardAccess) {
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

          HandsomeTrello.api.checklist.changeItemPos(card.id, card.childrenChecklist.id, checkItemId, newPosition, function (error, data) {
            if (error) {
              HandsomeTrello.notification.open(
                HandsomeTrello.settings.notification.messages.error('Request Error. Please, try again.')
              );
            } else if (data && data.pos) {
              HandsomeTrello.helpers.getElementByProperty(card.childrenChecklist.checkItems, 'id', checkItemId).pos = data.pos;
              HandsomeTrello.helpers.sortByProperty(card.children, 'checkItem.pos');
              ui.item.attr('data-children-pos', data.pos);
            }
          });
        }
      })
    },

    updateInheritanceListInOpenedCardView: function (card) {
      if (card) {
        var _descParentElement = document.querySelector('[attr="desc"]');

        if (HandsomeTrello.options.descriptionPosition === 'top') {
          HandsomeTrello.helpers.prependElement(this.generateHtmlForChildren(card.children), _descParentElement);
          HandsomeTrello.helpers.prependElement(this.generateHtmlForRelatedTasks(card, card.parent), _descParentElement);
          HandsomeTrello.helpers.prependElement(this.generateHtmlForParent(card.parent), _descParentElement);
        } else {
          HandsomeTrello.helpers.appendElement(this.generateHtmlForParent(card.parent), _descParentElement);
          HandsomeTrello.helpers.appendElement(this.generateHtmlForRelatedTasks(card, card.parent), _descParentElement);
          HandsomeTrello.helpers.appendElement(this.generateHtmlForChildren(card.children), _descParentElement);
        }

        this.bindDragAndDropOnChildren(card);
      }
    },

    updateCardView: function (card) {
      if (!card) {
        card = HandsomeTrello.getCurrentOpenedCard();
      }

      if (card && (card.status !== 'closed' || HandsomeTrello.options.showArchivedCards)) {
        this.updateInheritanceListInOpenedCardView(card);

        this.addButtonsOnRightSidebar();
      }
    },

    clearBadgeInCard: function (card) {
      if (!card._element) {
        return false;
      }

      HandsomeTrello.helpers.lockDOM('inheritance-clear-badge-card', true);

      var _checklistBadge = card._element.querySelector('.js-checklist-badge'),
          _checklistFakeBadge = card._element.querySelector('.js-fake-checklist-badge');

      if (!_checklistBadge) {
        if (_checklistFakeBadge) {
          HandsomeTrello.helpers.removeElement(_checklistFakeBadge);
          _checklistFakeBadge = null;
        }

        if (card._element.querySelector('.badge .icon-checklist')) {
          _checklistBadge = HandsomeTrello.helpers.findParentByClass(card._element.querySelector('.badge .icon-checklist'), 'badge');
          _checklistBadge.classList.add('js-checklist-badge');
        } else {
          HandsomeTrello.helpers.lockDOM('inheritance-clear-badge-card', false);

          return false;
        }
      }

      if (!_checklistFakeBadge) {
        _checklistFakeBadge = _checklistBadge.cloneNode(true);
        _checklistFakeBadge.classList.remove('js-checklist-badge');
        _checklistFakeBadge.classList.add('js-fake-checklist-badge');
        HandsomeTrello.helpers.appendElementAfterAnother(_checklistFakeBadge, _checklistBadge);
      }

      _checklistBadge.classList.add('hide');

      if (card.childrenChecklist && card.data.checklists.length === 1) {
        _checklistFakeBadge.classList.add('hide');
      } else {
        var countCheckItems = 0,
            countCompleteCheckItems = 0;

        for (var x = 0; x < card.data.checklists.length; x++) {
          var currentChecklist = card.data.checklists[x];

          if (!card.childrenChecklist || currentChecklist !== card.childrenChecklist) {
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

          if (countCompleteCheckItems === countCheckItems) {
            _checklistFakeBadge.classList.add('is-complete');
          } else {
            _checklistFakeBadge.classList.remove('is-complete');
          }
        } else {
          _checklistFakeBadge.classList.add('hide');
        }
      }

      HandsomeTrello.helpers.lockDOM('inheritance-clear-badge-card', false);
    },

    checkRecursion: function (object, property, value, oldParentsArray) {
      if (typeof oldParentsArray === 'undefined') {
        oldParentsArray = [];
      }

      if (object && object[property]) {
        if (object[property] === value) {
          return object;
        } else {
          var checkInParentsArray = HandsomeTrello.helpers.getElementByProperty(oldParentsArray, 'value', value);

          if (checkInParentsArray) {
            return checkInParentsArray.object
          } else {
            oldParentsArray.push({
              object: object,
              value: object[property]
            });

            return this.checkRecursion(object[property], property, value, oldParentsArray);
          }
        }
      } else {
        return false;
      }
    },

    changeParent: function (card, parent) {
      var self = this;

      if (!parent) {
        return false;
      }

      var checkDeleteParentFromCard = false;

      // removing current parent

      if (card.parent) {
        checkDeleteParentFromCard = (card.parent.id && parent.id && card.parent.id === parent.id);

        self.removeParent(card, checkDeleteParentFromCard);
      }

      // end removing current parent

      if (!checkDeleteParentFromCard) {
        // check recursion

        var checkParentRecursionCard = self.checkRecursion(parent, 'parent', card);

        if (checkParentRecursionCard) {
          console.warn(
              HandsomeTrello.settings.notification.messages.recursionOnBoard(
                  '#' + checkParentRecursionCard.idShort + ' ' + checkParentRecursionCard.title,
                  checkParentRecursionCard.url,
                  '#' + card.idShort + ' ' + card.title,
                  card.url
              ).outerHTML.replace(/<\/?[^>]+(>|$)/g, '')
          );

          HandsomeTrello.notification.open(
              HandsomeTrello.settings.notification.messages.recursionOnBoard(
                  '#' + checkParentRecursionCard.idShort + ' ' + checkParentRecursionCard.title,
                  checkParentRecursionCard.url,
                  '#' + card.idShort + ' ' + card.title,
                  card.url
              )
          );

          self.removeParent(checkParentRecursionCard, false);
        }

        // end check recursion

        // adding parent

        card.parent = parent;

        if (parent.childrenChecklist) {
          self.parentLoading(card.id, true);

          HandsomeTrello.api.checklist.addItem(parent.childrenChecklist.id, card.url, 'bottom', function (error, checkItemData) {
            if (error) {
              HandsomeTrello.notification.open(
                HandsomeTrello.settings.notification.messages.error('Request Error. Please, try again.')
              );
            } else {
              parent.childrenChecklist.checkItems.push(checkItemData);

              HandsomeTrello.helpers.lockDOM('inheritance-add-parent', true);

              self.readCards();

              HandsomeTrello.helpers.lockDOM('inheritance-add-parent', false);

              HandsomeTrello.popOver.close();
            }

            self.parentLoading(card.id, false);
          });
        } else {
          self.parentLoading(card.id, true);

          HandsomeTrello.api.checklist.create(parent.id, self.data.childrenName, 'top', function (error, checkListData) {
            if (error) {
              HandsomeTrello.notification.open(
                HandsomeTrello.settings.notification.messages.error('Request Error. Please, try again.')
              );

              self.parentLoading(card.id, false);
            } else {
              HandsomeTrello.api.checklist.addItem(checkListData.id, card.url, 'bottom', function (error, checkItemData) {
                if (error) {
                  HandsomeTrello.notification.open(
                    HandsomeTrello.settings.notification.messages.error('Request Error. Please, try again.')
                  );
                } else {
                  parent.data.checklists.push(checkListData);
                  parent.childrenChecklist = parent.data.checklists[parent.data.checklists.length - 1];
                  parent.childrenChecklist.checkItems.push(checkItemData);

                  HandsomeTrello.helpers.lockDOM('inheritance-add-parent', true);

                  self.readCards();

                  HandsomeTrello.helpers.lockDOM('inheritance-add-parent', false);

                  HandsomeTrello.popOver.close();
                }

                self.parentLoading(card.id, false);
              });
            }
          });
        }

        // end adding parent
      }
    },

    removeParent: function (card, closeParentPopOver) {
      var self = this;

      if (card && card.parent) {
        self.parentLoading(card.id, true);

        var cardShortId = card.idShort;

        if (card.parent.childrenChecklist.checkItems.length) {
          HandsomeTrello.api.checklist.deleteItem(card.parent.childrenChecklist.id, card.checkItem.id, function (error) {
            if (error) {
              HandsomeTrello.notification.open(
                HandsomeTrello.settings.notification.messages.error('Request Error. Please, try again.')
              );
            } else {
              card = HandsomeTrello.data.cards[cardShortId];

              card.parent.childrenChecklist.checkItems.splice(card.parent.childrenChecklist.checkItems.indexOf(card.checkItem), 1);

              self.readCards();

              if (closeParentPopOver) {
                HandsomeTrello.popOver.close();
              }
            }

            self.parentLoading(card.id, false);
          });
        } else {
          HandsomeTrello.api.checklist.remove(card.parent.childrenChecklist.id, function (error) {
            if (error) {
              HandsomeTrello.notification.open(
                HandsomeTrello.settings.notification.messages.error('Request Error. Please, try again.')
              );
            } else {
              card = HandsomeTrello.data.cards[cardShortId];

              card.parent.childrenChecklist.checkItems.splice(card.parent.childrenChecklist.checkItems.indexOf(card.checkItem), 1);
              card.parent.data.checklists.splice(card.parent.data.checklists.indexOf(card.parent.childrenChecklist), 1);
              card.parent.childrenChecklist = null;

              self.readCards();

              if (closeParentPopOver) {
                HandsomeTrello.popOver.close();
              }
            }

            self.parentLoading(card.id, false);
          });
        }

        card.checkItem = null;
        card.parent = null;

        return true;
      }

      return false;
    },

    checkValidationChildCheckItem: function (checkItemName) {
      var cardIdMatch = checkItemName.match(HandsomeTrello.data.regexp.cardId),
          cardLinkMatch = checkItemName.match(HandsomeTrello.data.regexp.cardIdFromLink);

      if (cardIdMatch && cardIdMatch[0] === checkItemName && HandsomeTrello.data.cards[cardIdMatch[1]]) {
        return HandsomeTrello.data.cards[cardIdMatch[1]];
      } else if (cardLinkMatch && HandsomeTrello.data.cards[cardLinkMatch[1]]) {
        return HandsomeTrello.data.cards[cardLinkMatch[1]];
      }

      return false;
    },

    moveFromSecondChildrenChecklistToFirst: function (card, checklist, indexChecklist) {
      var self = this;

      if (checklist.checkItems.length) {
        for (var z = 0; z < checklist.checkItems.length; z++) {
          var movingCheckItemName = checklist.checkItems[z].name.trim(),
              movingCard = self.checkValidationChildCheckItem(movingCheckItemName);

          if (movingCard) {
            if (card.children.indexOf(movingCard) < 0) {
              HandsomeTrello.api.checklist.addItem(card.childrenChecklist.id, movingCheckItemName, 'bottom', function (error, checkItemData) {
                if (!error) {
                  card.childrenChecklist.checkItems.push(checkItemData);

                  HandsomeTrello.helpers.lockDOM('inheritance-move-children-cards-to-other-children-list', true);

                  self.readCards();

                  HandsomeTrello.helpers.lockDOM('inheritance-move-children-cards-to-other-children-list', false);
                }
              });
            }
          }
        }
      }

      HandsomeTrello.api.checklist.remove(checklist.id);
      card.data.checklists.splice(indexChecklist, 1);
    },

    updateChildrenInCard: function (card) {
      var self = this;

      if (card.children && card.children.length) {
        for (var c = 0; c < card.children.length; c++) {
          var removingChild = card.children[c];

          removingChild.parent = null;
          removingChild.checkItem = null;
        }
      }

      card.children = [];
      card.childrenChecklist = null;

      for (var i = 0; i < card.data.checklists.length; i++) {
        var checklist = card.data.checklists[i];

        if (checklist.name.trim().toLowerCase() === self.data.childrenName.trim().toLowerCase()) {
          if (card.childrenChecklist) {
            if (!HandsomeTrello.data.init) {
              self.moveFromSecondChildrenChecklistToFirst(card, checklist, i);
            }

            continue;
          }

          if (!checklist.checkItems.length) {
            if (!HandsomeTrello.data.init) {
              HandsomeTrello.api.checklist.remove(checklist.id);
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

                if (childCard.status === 'closed' && !HandsomeTrello.options.showArchivedCards) {
                  continue;
                }

                var checkRecursionParent = self.checkRecursion(card, 'parent', childCard),
                    checkRecursionChildren = self.checkRecursion(childCard.parent, 'parent', card);

                if (card.id === childCard.id) {
                  console.warn(
                      HandsomeTrello.settings.notification.messages.recursionOnBoard(
                          '#' + childCard.idShort + ' ' + childCard.title,
                          childCard.url,
                          '#' + card.idShort + ' ' + card.title,
                          card.url
                      ).outerHTML.replace(/<\/?[^>]+(>|$)/g, '')
                  );

                  HandsomeTrello.notification.open(
                      HandsomeTrello.settings.notification.messages.recursionOnBoard(
                          '#' + childCard.idShort + ' ' + childCard.title,
                          childCard.url,
                          '#' + card.idShort + ' ' + card.title,
                          card.url
                      )
                  );
                }

                if (checkRecursionParent) {
                  console.warn(
                      HandsomeTrello.settings.notification.messages.recursionOnBoard(
                          '#' + childCard.idShort + ' ' + childCard.title,
                          childCard.url,
                          '#' + checkRecursionParent.idShort + ' ' + checkRecursionParent.title,
                          checkRecursionParent.url
                      ).outerHTML.replace(/<\/?[^>]+(>|$)/g, '')
                  );

                  HandsomeTrello.notification.open(
                      HandsomeTrello.settings.notification.messages.recursionOnBoard(
                          '#' + childCard.idShort + ' ' + childCard.title,
                          childCard.url,
                          '#' + checkRecursionParent.idShort + ' ' + checkRecursionParent.title,
                          checkRecursionParent.url
                      )
                  );
                }

                if (checkRecursionChildren) {
                  console.warn(
                      HandsomeTrello.settings.notification.messages.recursionOnBoard(
                          '#' + card.idShort + ' ' + card.title,
                          card.url,
                          '#' + checkRecursionChildren.idShort + ' ' + checkRecursionChildren.title,
                          checkRecursionChildren.url
                      ).outerHTML.replace(/<\/?[^>]+(>|$)/g, '')
                  );

                  HandsomeTrello.notification.open(
                      HandsomeTrello.settings.notification.messages.recursionOnBoard(
                          '#' + card.idShort + ' ' + card.title,
                          card.url,
                          '#' + checkRecursionChildren.idShort + ' ' + checkRecursionChildren.title,
                          checkRecursionChildren.url
                      )
                  );
                }

                if (card.children.indexOf(childCard) > -1 || checkRecursionParent || checkRecursionChildren || card.id === childCard.id) {
                  checklist.checkItems.splice(y, 1);

                  if (childCard.parent) {
                    if (
                        childCard.parent.children &&
                        childCard.parent.children.length &&
                        childCard.parent.children.lastIndexOf(childCard) > -1
                    ) {
                      childCard.parent.children.splice(childCard.parent.children.lastIndexOf(childCard), 1);
                    }

                    childCard.checkItem = null;
                    childCard.parent = null;
                  }

                  HandsomeTrello.api.checklist.deleteItem(checklist.id, checkItem.id);
                } else {
                  if (
                      childCard.parent &&
                      childCard.parent.id !== card.id &&
                      childCard.parent.childrenChecklist
                  ) {
                    var checkDoubleChildCheckItem = HandsomeTrello.helpers.getElementByProperty(
                        childCard.parent.childrenChecklist.checkItems,
                        'name',
                        childCard.url
                    );

                    if (!checkDoubleChildCheckItem) {
                      HandsomeTrello.helpers.getElementByProperty(childCard.parent.childrenChecklist.checkItems, 'name', '#' + childCard.idShort);
                    }

                    if (checkDoubleChildCheckItem) {
                      console.error(123);

                      console.warn(
                          HandsomeTrello.settings.notification.messages.severalParentsOnCard(
                              '#' + childCard.idShort + ' ' + childCard.title,
                              childCard.url,
                              '#' + childCard.parent.idShort + ' ' + childCard.parent.title,
                              childCard.parent.url
                          ).outerHTML.replace(/<\/?[^>]+(>|$)/g, ''));

                      HandsomeTrello.notification.open(
                          HandsomeTrello.settings.notification.messages.severalParentsOnCard(
                              '#' + childCard.idShort + ' ' + childCard.title,
                              childCard.url,
                              '#' + childCard.parent.idShort + ' ' + childCard.parent.title,
                              childCard.parent.url
                          )
                      );

                      self.removeParent(childCard, false);
                    }
                  }

                  childCard.checkItem = checkItem;
                  card.children.push(childCard);
                  childCard.parent = card;
                }
              } else if (!HandsomeTrello.data.init) {
                HandsomeTrello.api.checklist.deleteItem(checklist.id, checkItem.id);
                checklist.checkItems.splice(y, 1);
              }
            }

            HandsomeTrello.helpers.sortByProperty(card.children, 'checkItem.pos');
          }
        }
      }

      self.clearBadgeInCard(card);

      var openedCard = HandsomeTrello.getCurrentOpenedCard();

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

      HandsomeTrello.api.card.get(card.id, function (error, cardData) {
        if (error) {
          HandsomeTrello.notification.open(
            HandsomeTrello.settings.notification.messages.error('Request Error. Please, reload the page.')
          );
        } else {
          card.data = cardData;

          self.parseCard(card);
        }
      });
    },

    checkItemUpdated: function (_target) {
      var self = this;

      if (!_target) {
        return false;
      }

      var _checklist = HandsomeTrello.helpers.findParentByClass(_target, 'checklist');

      if (
          _checklist &&
          _checklist.querySelector('h3') &&
          _checklist.querySelector('h3').textContent.trim().toLowerCase() === self.data.childrenName.toLowerCase()
      ) {
        var openedCard = HandsomeTrello.getCurrentOpenedCard();

        if (openedCard && openedCard.childrenChecklist) {
          HandsomeTrello.api.checklist.get(openedCard.childrenChecklist.id, function (error, checklistData) {
            if (!error) {
              openedCard.data.checklists[openedCard.data.checklists.indexOf(openedCard.childrenChecklist)].checkItems = checklistData.checkItems;

              self.parseCard(openedCard);

              self.updateCardView();
            }
          });
        }
      }
    },

    init: function () {
      var self = this;

      HandsomeTrello.helpers.eventListener('handsomeTrello.parentLoading', function (event) {
        var openedCard = HandsomeTrello.getCurrentOpenedCard();

        if (!openedCard || event.detail.id !== openedCard.id) {
          return false;
        }

        var _popOverContent = document.querySelector('.js-pop-over-content'),
            _parentChangeSearchField = document.querySelector('.js-parent-change-search-field');

        if (!_popOverContent || !_parentChangeSearchField) {
          return false;
        }

        if (event.detail.status) {
          _popOverContent.classList.add('pop-over-content--loading');
          _parentChangeSearchField.setAttribute('disabled', 'disabled');
          _parentChangeSearchField.blur();
        } else {
          _popOverContent.classList.remove('pop-over-content--loading');
          _parentChangeSearchField.removeAttribute('disabled');
          _parentChangeSearchField.focus();
          self.openParentChangePopOver();
        }
      });

      HandsomeTrello.helpers.eventListener('handsomeTrello.childrenLoading', function (event) {
        var openedCard = HandsomeTrello.getCurrentOpenedCard();

        if (!openedCard || event.detail.id !== openedCard.id) {
          return false;
        }

        var _popOverContent = document.querySelector('.js-pop-over-content'),
            _childrenCreateTitleField = document.querySelector('.js-children-create-title-field'),
            _childrenCreateSubmitBtn = document.querySelector('.js-children-create-submit-btn');

        if (!_popOverContent || !_childrenCreateTitleField || !_childrenCreateSubmitBtn) {
          return false;
        }

        if (event.detail.status) {
          _popOverContent.classList.add('pop-over-content--loading');
          _childrenCreateTitleField.setAttribute('disabled', 'disabled');
          _childrenCreateSubmitBtn.setAttribute('disabled', 'disabled');
          _childrenCreateTitleField.blur();
        } else {
          _popOverContent.classList.remove('pop-over-content--loading');
          _childrenCreateTitleField.removeAttribute('disabled');
          _childrenCreateSubmitBtn.removeAttribute('disabled');
          _childrenCreateTitleField.focus();
        }
      });

      HandsomeTrello.callbacks.cardsUpdated['inheritance'] = function () {
        self.readCards();
      };

      HandsomeTrello.callbacks.openCardViewed['inheritance'] = function (card) {
        self.openCardViewed(card);
      };

      HandsomeTrello.callbacks.checklistInserted['inheritance'] = function (_target) {
        if (
            _target.querySelector('h3') &&
            _target.querySelector('h3').textContent.trim().toLowerCase() === self.data.childrenName.toLowerCase()
        ) {
          _target.classList.add('hide');

          self.updateCardView();
        }
      };

      HandsomeTrello.callbacks.checkItemUpdated['inheritance'] = function (_target) {
        self.checkItemUpdated(_target);
      };

      HandsomeTrello.callbacks.badgeChecklistUpdated['inheritance'] = function (card) {
        self.parseCard(card);

        self.updateCardView();
      };
    }
  };

})();
