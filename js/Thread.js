board.Thread = new Class({
  Extends: board.Resource,
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

board.Thread.implement({

  // TODO links need to point to their respective threads too, no way to know that yet
  addPost: function (post) {
    var ids = post.postRefs().filter(function (x) {
      return !!$(x);
    });
    this.graph.append(ids.length ? ids : [this.id] , post.id);
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
    var cache = this.cache();
    if (!this.element) {
      this.element = responseTree[0];
    } else {
      cache.adopt(responseTree[0]
        .getElements('article')
        .map(function (post) {
          var id = post.id
            , impostor = $(id)
          ;
          if (impostor) {
            if (!impostor.getParent().match('article'))
              return impostor;
            else
              return false;
          } else {
            return post;
          }
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
