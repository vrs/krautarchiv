board.Resource = (function () {
  var resourceCache = {};

  return new Class({
    initialize: function (type) {
      this.url = [
        '/res',
        window.boardName,
        type,
        this.id
      ].join('/');
      this.hooks = {
        'load': [],
        'get': []
      };
      return resourceCache[this.url] || (resourceCache[this.url] = this);
    }
  });
})();

board.Resource.implement({

  fireHooks: function (eventType) {
    this.hooks[eventType].forEach(function (f) {
      f(this);
    }, this);
  },

  get: function (forceAsync) {
    if (this.isCached()) {
      if (forceAsync) {
        setTimeout(function () {
          this.fireHooks('get');
        }.bind(this));
      } else {
        this.fireHooks('get');
      }
    } else {
      new Request.HTML({
        url: this.url,
        onSuccess: function (responseTree) {
          this.parseResource(responseTree);
          this.fireHooks('load');
          this.fireHooks('get');
        }.bind(this)
      }).get();
    }
  },

  onGet: function (hook) {
    this.hooks.get.push(hook);
    return this;
  },

  onLoad: function (hook) {
    this.hooks.load.push(hook);
    return this;
  },

  removeHook: function (eventType, hook) {
    this.hooks[eventType].erase(hook);
    return this;
  },

});
