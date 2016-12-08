var HandsomeTrello = {
  plugins: {},

  callbacks: {
    cardsUpdated: {},
    openCardViewed: {},
    checklistInserted: {},
    checkItemUpdated: {},
    badgeChecklistUpdated: {}
  },

  settings: {
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
      openChildCard: {
        title: 'Open Child Card after adding',
        type: 'boolean',
        value: true
      },
      showArchivedCards: {
        title: 'Show Archived Cards in children and related lists',
        type: 'boolean',
        value: true
      },
      showCardDueDate: {
        title: 'Show Due Date in children and related lists and parent',
        type: 'boolean',
        value: false
      },
      showCardId: {
        title: 'Show Card Ids in children and related lists and parent',
        type: 'boolean',
        value: false
      },
      descriptionPosition: {
        title: 'The position of Parent/Siblings/Child blocks relative to the description',
        type: 'select',
        options: [
          {
            label: 'Top',
            value: 'top'
          },
          {
            label: 'Bottom',
            value: 'bottom'
          }
        ],
        value: 'bottom'
      },
      orderOfBlocks: {
        title: 'The order of Parent/Siblings/Child blocks',
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
  }
};
