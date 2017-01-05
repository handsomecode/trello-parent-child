var HandsomeTrello = {};

(function (HandsomeTrello) {
  'use strict';

  HandsomeTrello.plugins = {};

  HandsomeTrello.callbacks = {
    cardsUpdated: {},
    openCardViewed: {},
    checklistInserted: {},
    checkItemUpdated: {},
    badgeChecklistUpdated: {}
  };

  HandsomeTrello.settings = {
    locale: 'en-US',
    plugins: {
      'inheritance': true
    },
    popOver: {
      offset: 6,
      resizeTimeout: 100
    },
    reloadTimeout: 500,
    notification: {
      defaultTimeout: 10000,
      messages: {
        error: function (message) {
          return HandsomeTrello.helpers.jsonToDOM(['span', {}, message]);
        },
        recursionOnBoard: function (recursionCardTitle, recursionCardLink, currentCardTitle, currentCardLink) {
          return HandsomeTrello.helpers.jsonToDOM(['span', {},
            ['a', {
              'href': recursionCardLink
            },
              recursionCardTitle
            ],
            ' is not a child for ',
            ['a', {
              'href': currentCardLink
            },
              currentCardTitle
            ],
            ' anymore, due to fix for cycle Parent/Child dependency'
          ]);
        },
        severalParentsOnCard: function (recursionCardTitle, recursionCardLink, currentCardTitle, currentCardLink) {
          return HandsomeTrello.helpers.jsonToDOM(['span', {},
            ['a', {
              'href': recursionCardLink
            },
              recursionCardTitle
            ],
            ' is not a child for ',
            ['a', {
              'href': currentCardLink
            },
              currentCardTitle
            ],
            ' anymore, due to fix for multiple Parents dependency'
          ]);
        }
      }
    },
    options: {
      showArchivedCards: {
        title: 'Show Archived Cards',
        description: 'Show Archived Cards in children and related lists',
        type: 'boolean',
        value: true
      },
      showCardDueDate: {
        title: 'Show Card Due Date',
        description: 'Show Due Date in children and related lists and parent',
        type: 'boolean',
        value: false
      },
      showCardId: {
        title: 'Show Card IDs',
        description: 'Show Card IDs for Parent/Siblings/Child Cards',
        type: 'boolean',
        value: false
      },
      openChildCard: {
        title: 'Open Child Card when adding',
        description: 'Open Child Card when adding',
        type: 'boolean',
        value: true
      },
      descriptionPosition: {
        title: 'Position of Cards relative to the description',
        description: 'Position of Parent/Siblings/Child Cards relative to the description',
        type: 'select',
        options: [
          {
            label: 'Above',
            value: 'top'
          },
          {
            label: 'Below',
            value: 'bottom'
          }
        ],
        value: 'bottom'
      },
      orderOfBlocks: {
        title: 'Order of Parent/Siblings/Child blocks',
        description: 'Order of Parent/Siblings/Child blocks',
        type: 'select',
        options: [
          {
            label: 'Parent - Siblings - Children',
            value: 'parent-related-children'
          },
          {
            label: 'Parent - Children - Siblings',
            value: 'parent-children-related'
          },
          {
            label: 'Siblings - Parent - Children',
            value: 'related-parent-children'
          }
        ],
        value: 'parent-related-children'
      }
    }
  };

})(HandsomeTrello);
