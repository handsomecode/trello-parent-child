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
    if (HandsomeTrello.settings.options.hasOwnProperty(optionId)) {
      var option = HandsomeTrello.settings.options[optionId];

      var _option = document.createElement('div');

      _option.classList.add('options__row');

      if (option.type === 'boolean') {
        _option.classList.add('options__row--checkbox');

        var _optionInput = document.createElement('input'),
          _optionCheckboxLabel = document.createElement('label');

        _optionInput.setAttribute('type', 'checkbox');
        _optionInput.classList.add('options__checkbox');
        _optionInput.setAttribute('id', 'option-' + optionId.toLowerCase());
        _optionCheckboxLabel.classList.add('options__label');
        _optionCheckboxLabel.textContent = option.title;
        _optionCheckboxLabel.setAttribute('for', 'option-' + optionId.toLowerCase());

        _option.appendChild(_optionInput);
        _option.appendChild(_optionCheckboxLabel);

        optionsList[optionId] = option;
        optionsList[optionId]._input = _optionInput;
      } else if (option.type === 'select') {
        _option.classList.add('options__row--select');

        var _optionSelectLabel = document.createElement('label'),
          _optionSelect = document.createElement('select');

        _optionSelectLabel.classList.add('options__label');
        _optionSelectLabel.textContent = option.title + ':';
        _optionSelectLabel.setAttribute('for', 'option-' + optionId.toLowerCase());
        _optionSelect.setAttribute('type', 'select');
        _optionSelect.classList.add('options__select');
        _optionSelect.setAttribute('id', 'option-' + optionId.toLowerCase());

        if (option.options && option.options.length) {
          option.options.forEach(function (selectOption) {
            var _optionSelectOption = document.createElement('option');
            _optionSelectOption.classList.add('options__select-option');
            _optionSelectOption.setAttribute('value', selectOption.value);
            _optionSelectOption.innerText = selectOption.label;

            _optionSelect.appendChild(_optionSelectOption);
          });
        }

        _option.appendChild(_optionSelectLabel);
        _option.appendChild(_optionSelect);

        optionsList[optionId] = option;
        optionsList[optionId]._input = _optionSelect;
      }

      getOptions[optionId] = option.value;

      _options.appendChild(_option);
    }
  }

  function loadOptions() {
    chrome.storage.sync.get(getOptions, function(storageOptions) {
      for (var optionId in optionsList) {
        var currentOption = optionsList[optionId];

        if (currentOption.type === 'boolean') {
          currentOption._input.checked = storageOptions[optionId]
        } else {
          currentOption._input.value = storageOptions[optionId]
        }
      }
    });
  }

  loadOptions();

  _submitBtn.addEventListener('click', function () {
    var setOptions = {};

    for (var optionId in optionsList) {
      var currentOption = optionsList[optionId];

      setOptions[optionId] = currentOption.type === 'boolean' ? currentOption._input.checked : currentOption._input.value;
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
