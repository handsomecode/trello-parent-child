HandsomeTrello.helpers = {
  data: {
    lockCheckUpdateDOM: {}
  },

  getCookie: function (name) {
    var matches = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));

    return matches ? decodeURIComponent(matches[1]) : undefined;
  },

  initEvent: function (name, detail) {
    if (typeof detail === 'undefined') {
      detail = null;
    }

    document.dispatchEvent(
      new CustomEvent(name, {
        detail: detail
      })
    );
  },

  eventListener: function (name, callback) {
    document.addEventListener(name, callback);
  },

  goToLink: function (url) {
    var _link = document.createElement('a');

    _link.setAttribute('href', url);
    _link.classList.add('hide');

    document.body.appendChild(_link);

    _link.click();

    HandsomeTrello.helpers.removeElement(_link);
  },

  generateGetParamsStringFromObject: function (object) {
    var stringData = '';

    for (var key in object) {
      if (stringData !== '') {
        stringData += '&';
      }
      stringData += key + '=' + encodeURIComponent(object[key]);
    }

    return stringData;
  },

  sortByProperty: function (array, property) {
    function getPropertyByPath(object) {
      return property.split('.').reduce(function (val, key) {
        return val[key];
      }, object);
    }

    array.sort(function (a, b) {
      return getPropertyByPath(a) - getPropertyByPath(b);
    });
  },

  isJSONString: function (string) {
    try {
      JSON.parse(string);
    } catch (e) {
      return false;
    }
    return true;
  },

  triggerResize: function () {
    window.dispatchEvent(new Event('resize'));
  },

  findParentByClass: function (_element, className) {
    if (typeof _element !== 'undefined') {
      while (typeof _element.parentElement !== 'undefined' && (_element = _element.parentElement) !== null) {
        if (_element.classList.contains(className)) {
          return _element;
        }
      }
    }

    return false;
  },

  getOffset: function (_element) {
    function getOffsetSum(_element) {
      var top = 0,
        left = 0;

      while (_element) {
        top = top + parseInt(_element.offsetTop);
        left = left + parseInt(_element.offsetLeft);

        _element = _element.offsetParent;
      }

      return {
        top: top,
        left: left
      };
    }

    function getOffsetRect(_element) {
      var box = _element.getBoundingClientRect(),
        body = document.body,
        docElem = document.documentElement,
        scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop,
        scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft,
        clientTop = docElem.clientTop || body.clientTop || 0,
        clientLeft = docElem.clientLeft || body.clientLeft || 0,
        top = box.top + scrollTop - clientTop,
        left = box.left + scrollLeft - clientLeft;

      return {
        top: Math.round(top),
        left: Math.round(left)
      };
    }

    if (_element.getBoundingClientRect) {
      return getOffsetRect(_element);
    } else {
      return getOffsetSum(_element);
    }
  },

  jsonToDOM: function (json, doc, nodes) {
    if (typeof doc === 'undefined') {
      doc = document;
    }

    if (typeof nodes === 'undefined') {
      nodes = {};
    }

    var namespaces = {
      html: 'http://www.w3.org/1999/xhtml',
      xul: 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul'
    };
    var defaultNamespace = namespaces.html;

    function namespace(name) {
      var m = /^(?:(.*):)?(.*)$/.exec(name);
      return [namespaces[m[1]], m[2]];
    }

    function tag(name, attr) {
      if (Array.isArray(name)) {
        var frag = doc.createDocumentFragment();
        Array.prototype.forEach.call(arguments, function (arg) {
          if (!Array.isArray(arg[0]))
            frag.appendChild(tag.apply(null, arg));
          else
            arg.forEach(function (arg) {
              frag.appendChild(tag.apply(null, arg));
            });
        });
        return frag;
      }

      var args = Array.prototype.slice.call(arguments, 2);
      var vals = namespace(name);
      var elem = doc.createElementNS(vals[0] || defaultNamespace, vals[1]);

      for (var key in attr) {
        var val = attr[key];
        if (nodes && key == 'key')
          nodes[val] = elem;

        vals = namespace(key);
        if (typeof val == 'function')
          elem.addEventListener(key.replace(/^on/, ''), val, false);
        else
          elem.setAttributeNS(vals[0] || '', vals[1], val);
      }
      args.forEach(function (e) {
        try {
          elem.appendChild(
            Object.prototype.toString.call(e) == '[object Array]'
              ?
              tag.apply(null, e)
              :
              e instanceof doc.defaultView.Node
                ?
                e
                :
                doc.createTextNode(e)
          );
        } catch (ex) {
          elem.appendChild(doc.createTextNode(ex));
        }
      });

      return elem;
    }

    return tag.apply(null, json);
  },

  appendElementAfterAnother: function (_element, _beforeElement) {
    if (_beforeElement.nextSibling) {
      _beforeElement.parentNode.insertBefore(_element, _beforeElement.nextSibling);
    } else {
      _beforeElement.parentNode.appendChild(_element);
    }
  },

  appendElement: function (_element, _parentElement) {
    if (typeof _element === 'undefined') {
      return false;
    }

    _parentElement.appendChild(_element);
  },

  prependElement: function (_element, _parentElement) {
    if (typeof _element === 'undefined') {
      return false;
    }

    if (_parentElement.firstChild) {
      _parentElement.insertBefore(_element, _parentElement.firstChild);
    } else {
      _parentElement.appendChild(_element);
    }
  },

  removeElement: function (_element) {
    if (
      typeof _element !== 'undefined' &&
      typeof _element.parentElement !== 'undefined' &&
      typeof _element.parentElement.removeChild !== 'undefined'
    ) {
      this.lockDOM('removeElement', true);

      _element.parentElement.removeChild(_element);

      this.lockDOM('removeElement', false);
    }
  },

  getElementByProperty: function (object, property, value) {
    for (var key in object) {
      if (object[key][property] == value) {
        return object[key];
      }
    }

    return false;
  },

  checkLockedDOM: function () {
    return Object.keys(this.data.lockCheckUpdateDOM).length;
  },

  lockDOM: function (target, status) {
    var hasLockCheckUpdateDOM = typeof this.data.lockCheckUpdateDOM[target] !== 'undefined';

    if (status) {
      if (hasLockCheckUpdateDOM) {
        this.data.lockCheckUpdateDOM[target]++;
      } else {
        this.data.lockCheckUpdateDOM[target] = 1;
      }
    } else {
      if (hasLockCheckUpdateDOM) {
        this.data.lockCheckUpdateDOM[target]--;

        if (!this.data.lockCheckUpdateDOM[target]) {
          delete this.data.lockCheckUpdateDOM[target];
        }
      }
    }
  }
};
