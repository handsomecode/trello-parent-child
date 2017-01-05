var imports = require('node-import');

imports('src/js/config');

var settings = HandsomeTrello.settings;

var mapTypes = {
  boolean: 'CheckBox',
  select: 'PopUpButton'
};

var configTransform = function () {
  var options = [];

  for (var optionName in settings.options) {
    if (settings.options.hasOwnProperty(optionName)) {
      var optionValue = settings.options[optionName];

      var optionResult = {
        Key: optionName,
        Title: optionValue.title,
        Type: mapTypes[optionValue.type],
        DefaultValue: optionValue.value
      };

      if (typeof optionValue.options !== 'undefined') {
        optionResult.Titles = optionValue.options.map(function (option) {
          return option.label;
        });

        optionResult.Values = optionValue.options.map(function (option) {
          return option.value;
        });
      }

      options.push(optionResult);
    }
  }

  return options;
};

module.exports = configTransform;
