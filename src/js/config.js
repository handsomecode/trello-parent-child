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
        recursionOnBoard: '<a href="%recursionCardLink%">%recursionCardTitle%</a> is not a child for <a href="%currentCardLink%">%currentCardTitle%</a> anymore, due to fix for cycle Parent/Child dependency',
        severalParentsOnCard: '<a href="%recursionCardLink%">%recursionCardTitle%</a> is not a child for <a href="%currentCardLink%">%currentCardTitle%</a> anymore, due to fix for multiple Parents dependency'
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
      }
    }
  }
};
