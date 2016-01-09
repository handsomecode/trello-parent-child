(function (HandsomeTrello) {
  'use strict';

  var _options = document.getElementById('options'),
      _submitBtn = document.getElementById('submit'),
      _resetBtn = document.getElementById('reset'),
      _status = document.getElementById('status'),
      optionsList = {},
      getOptions = {},
      saveTimeOut = 0;

  for (var optionId in HandsomeTrello.settings.options) {
    var option = HandsomeTrello.settings.options[optionId];

    var _option = document.createElement('div'),
        _optionInput = document.createElement('input'),
        _optionLabel = document.createElement('label');

    _option.classList.add('options__row');
    _optionInput.setAttribute('type', 'checkbox');
    _optionInput.classList.add('options__checkbox');
    _optionInput.setAttribute('id', 'option-' + optionId.toLowerCase());
    _optionLabel.classList.add('options__label');
    _optionLabel.textContent = option.title;
    _optionLabel.setAttribute('for', 'option-' + optionId.toLowerCase());

    _option.appendChild(_optionInput);
    _option.appendChild(_optionLabel);

    optionsList[optionId] = option;
    optionsList[optionId]._input = _optionInput;

    getOptions[optionId] = option.value;

    _options.appendChild(_option);
  }

  function loadOptions() {
    chrome.storage.sync.get(getOptions, function(storageOptions) {
      for (var optionId in optionsList) {
        optionsList[optionId]._input.checked = storageOptions[optionId];
      }
    });
  }

  loadOptions();

  _submitBtn.addEventListener('click', function () {
    var setOptions = {};

    for (var optionId in optionsList) {
      setOptions[optionId] = optionsList[optionId]._input.checked;
    }

    chrome.storage.sync.set(setOptions, function() {
      _status.classList.add('options__status--showed');

      clearTimeout(saveTimeOut);

      saveTimeOut = setTimeout(function () {
        _status.classList.remove('options__status--showed');
      }, 2000);
    });
  });

  _resetBtn.addEventListener('click', function () {
    loadOptions();
  });

})(HandsomeTrello);
