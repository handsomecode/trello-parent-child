HandsomeTrello.popOver = {
  data: {
    title: null,
    resizeTimeout: 0
  },

  _generate: function (_popOver, title, _content) {
    var _popOverHeader = document.createElement('div');
    _popOverHeader.classList.add('pop-over-header');
    _popOverHeader.classList.add('js-pop-over-header');

    var _popOverTitle = document.createElement('span');
    _popOverTitle.classList.add('pop-over-header-title');
    _popOverTitle.textContent = title;

    var _popOverCloseBtn = document.createElement('a');
    _popOverCloseBtn.setAttribute('href', '#');
    _popOverCloseBtn.classList.add('pop-over-header-close-btn');
    _popOverCloseBtn.classList.add('icon-sm');
    _popOverCloseBtn.classList.add('icon-close');

    var _popOverContent = document.createElement('div');
    _popOverContent.classList.add('pop-over-content');
    _popOverContent.classList.add('js-pop-over-content');
    _popOverContent.classList.add('u-fancy-scrollbar');
    _popOverContent.classList.add('js-tab-parent');
    _popOverContent.appendChild(_content);

    _popOverHeader.appendChild(_popOverTitle);
    _popOverHeader.appendChild(_popOverCloseBtn);

    _popOver.innerHTML = '';
    _popOver.appendChild(_popOverHeader);
    _popOver.appendChild(_popOverContent);

    return {
      _popOverHeader: _popOverHeader,
      _popOverTitle: _popOverTitle,
      _popOverCloseBtn: _popOverCloseBtn,
      _popOverContent: _popOverContent
    };
  },

  _changePosition: function (_popOver, _target) {
    var targetOffset = HandsomeTrello.helpers.getOffset(_target),
      popOverWidth = _popOver.offsetWidth,
      popOverHeight = _popOver.offsetHeight,
      targetHeight = _target.offsetHeight,
      popOverTop =
        targetOffset.top +
        targetHeight +
        popOverHeight > window.innerHeight ?
        window.innerHeight - popOverHeight :
        targetOffset.top + targetHeight + HandsomeTrello.settings.popOver.offset,
      popOverLeft =
        targetOffset.left +
        popOverWidth +
        HandsomeTrello.settings.popOver.offset > window.innerWidth ?
        window.innerWidth - popOverWidth - HandsomeTrello.settings.popOver.offset :
          targetOffset.left;

    _popOver.style.top = popOverTop + 'px';
    _popOver.style.left = popOverLeft + 'px';
  },

  _change: function (open, title, _content, _target) {
    var self = this;

    title = open ? title : '';
    _content = open ? _content : false;

    var _popOver = document.querySelector('.pop-over'),
      _windowOverlay = document.querySelector('.window-overlay'),
      _window = _windowOverlay.querySelector('.window'),
      _sidebarButtons = _window.querySelectorAll('.button-link');

    function resizePopOver() {
      clearTimeout(self.data.resizeTimeout);

      self.data.resizeTimeout = setTimeout(function () {
        self._changePosition(_popOver, _target);
      }, HandsomeTrello.settings.popOver.resizeTimeout);
    }

    function openPopOver() {
      if (!self.data.title || self.data.title !== title) {
        closePopOver();

        _popOver._buttonTarget = _target;

        var popOverElements = self._generate(_popOver, title, _content);

        _popOver.classList.add('is-shown');

        document.body.addEventListener('keydown', keyDownPopOver);

        popOverElements._popOverCloseBtn.addEventListener('click', clickPopOver);
        document.querySelector('.js-close-window').addEventListener('click', clickPopOver);
        _window.addEventListener('click', clickPopOver);
        _windowOverlay.addEventListener('click', clickPopOver);
        window.addEventListener('resize', resizePopOver);

        self.update();

        for (var i = 0; i < _sidebarButtons.length; i++) {
          _sidebarButtons[i].addEventListener('click', clickPopOver);
        }

        setTimeout(function () {
          self.update();

          self.data.title = title;
        }, 1);

        return popOverElements;
      }

      return false;
    }

    function closePopOver() {
      if (self.data.title) {
        _popOver.classList.remove('is-shown');

        document.body.removeEventListener('keydown', keyDownPopOver);

        _window.removeEventListener('click', clickPopOver);
        _windowOverlay.removeEventListener('click', clickPopOver);
        window.removeEventListener('resize', resizePopOver);

        for (var i = 0; i < _sidebarButtons.length; i++) {
          _sidebarButtons[i].removeEventListener('click', clickPopOver);
        }

        self.data.title = null;
        _popOver.innerHTML = '';

        return true;
      }

      return false;
    }

    function keyDownPopOver(e) {
      if (e.keyCode === 27 && self.data.title) { // Esc
        e.stopPropagation();

        closePopOver();
      }
    }

    function clickPopOver(e) {
      if (
        self.data.title &&
        e.currentTarget.classList &&
        (
          (
            !e.currentTarget.classList.contains('pop-over') && !HandsomeTrello.helpers.findParentByClass(e.currentTarget, 'pop-over')
          ) ||
          e.currentTarget.classList.contains('pop-over-header-close-btn') ||
          e.currentTarget.classList.contains('js-close-window')
        )
      ) {
        closePopOver();
      }
    }

    if (open) {
      return openPopOver();
    } else {
      return closePopOver();
    }
  },

  update: function () {
    var self = this;

    var _popOver = document.querySelector('.pop-over');

    if (_popOver && _popOver._buttonTarget) {
      self._changePosition(_popOver, _popOver._buttonTarget);
    }
  },

  check: function (title, close) {
    var self = this;

    if (!self.data.title || self.data.title !== title) {
      return true;
    } else {
      if (typeof close !== 'undefined' && close) {
        self.close();
      }

      return false;
    }
  },

  open: function (title, _content, _target) {
    return this._change(true, title, _content, _target);
  },

  close: function () {
    return this._change(false);
  }
};
