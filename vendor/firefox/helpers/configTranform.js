var imports = require('node-import');

imports('src/js/config');

var settings = HandsomeTrello.settings;

var mapTypes = {
  boolean: 'bool',
  select: 'menulist'
};

var configTransform = function () {
  var options = [];

  for (var optionName in settings.options) {
    if (settings.options.hasOwnProperty(optionName)) {
      var optionValue = settings.options[optionName];

      var optionResult = {
        name: optionName,
        title: optionValue.title,
        description: optionValue.description,
        type: mapTypes[optionValue.type],
        value: optionValue.value
      };

      if (typeof optionValue.options !== 'undefined') {
        optionResult.options = optionValue.options;
      }

      options.push(optionResult);
    }
  }

  return options;
};

module.exports = configTransform;
