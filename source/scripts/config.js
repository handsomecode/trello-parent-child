var TrelloHelper = {
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
    notification: {
      defaultTimeout: 10000,
      messages: {
        recursionOnBoard: '<a href="%recursionCardLink%">%recursionCardTitle%</a> is not a child for <a href="%currentCardLink%">%currentCardTitle%</a> anymore, due to fix for cycle Parent/Child dependency',
        severalParentsOnCard: '<a href="%recursionCardLink%">%recursionCardTitle%</a> is not a child for <a href="%currentCardLink%">%currentCardTitle%</a> anymore, due to fix for multiple Parents dependency'
      }
    },
    openChildCard: true
  }
};
