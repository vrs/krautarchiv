var board = (function () {
  var postCache = new Element('div.cache#post_cache')
    , resourceCache = {}
  ;


var Resource = new Class({
  initialize: function (type) {
    this.url = [
      '/res',
      window.boardName,
      type,
      this.id
    ].join('/');
    this.hooks = { 'load': [] };
    return resourceCache[this.url] || (resourceCache[this.url] = this);
  }
});

Resource.implement({

  fireHooks: function (eventType) {
    this.hooks[eventType].forEach(function (f) {
      f(this);
    }, this);
  },

  load: function (forceAsync) {
    if (this.isCached()) {
      if (forceAsync) {
        setTimeout(function () {
          this.fireHooks('load');
        }.bind(this));
      } else {
        this.fireHooks('load');
      }
    } else {
      new Request.HTML({
        url: this.url,
        onSuccess: function (responseTree) {
          this.parseResource(responseTree);
          this.fireHooks('load');
        }.bind(this)
      }).get();
    }
  },

  onLoad: function (callback) {
    this.hooks.load.push(callback);
    return this;
  },

});


var Post = new Class({
  Extends: Resource,
  initialize: function (post) {
    if (typeOf(post) === 'string') {
      this.id = post;
      this.element = $(post) || null;
    } else {
      this.id = post.id;
      this.element = post;
    }
    this.refs = null;
    return this.parent('post');
  }
});

Post.implement({

  isCached: function () {
    return !!this.element;
  },

  parseResource: function (responseTree) {
    this.element = Array.from(responseTree).filter(function (el) {
      return el.match && el.match('article')
    })[0];
    postCache.grab(this.element); // prerenders
  },

  postRefs: function () {
    if (!this.element)
      return null;
    if (!this.refs)
      this.refs = this.element
        .getElements('.post_text a[onclick^=highlightPost]')
        .map(getTarget)
        .sort()
        .unique();
    return this.refs;
  },

});


var Thread = new Class({
  Extends: Resource,
  initialize: function (thread) {
    if (typeOf(thread) === 'string') {
      this.id = thread;
      this.element = $('thread_' + thread) || null;
    } else {
      this.id = thread.id.match(/\d+/)[0];
      this.element = thread;
    }
    this.graph = null;
    return this.parent('thread');
  }
});

Thread.implement({

  addPost: function (post) {
    this.graph.append(
      post.postRefs().filter(function (x) {
        return !!$(x);
      }), post.id);
  },

  cache: function () {
    return this.element.getElementById('cache_' + this.id);
  },

  isCached: function () {
    var omitted = this.omitted()
      , actualLength = this.posts().length
      , requiredLength = omitted ? +omitted.dataset.posts + 4 : actualLength
    ;
    return requiredLength <= actualLength;
  },

  omitted: function () {
    return this.element.getElement('.omittedposts');
  },

  parseResource: function (responseTree) {
    if (!this.element) {
      this.element = responseTree[0];
    } else {
      this.cache().adopt(responseTree[0]
        .getElements('article')
        .filter(function (post) {
          var id = post.id
            , impostor = $(id)
          ;
          if (impostor && !impostor.getParent().match('article')) {
            impostor = impostor.destroy();
          }
          return !impostor;
        })
      );
    }
  },

  posts: function () {
    return this.element
      .getElements('article')
      .sort(function (a, b) {
        return +a.id - b.id
      });
  },

  // TODO automatically check expiration
  postGraph: function (regenerate) {
    if (!this.graph || regenerate) {
      this.graph = new DAG(this.id);
      this.posts().forEach(function (post) {
        this.addPost(new board.Post(post));
      }, this);
    }
    return this.graph;
  },

});


window.addEvent('domready', function () {
  postCache.inject(document.body);
});

return {
  Post: Post,
  Thread: Thread
};
})()
