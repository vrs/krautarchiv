var board = (function () {
  var postCache = new Element('div.cache#post_cache')
    , graphCache = {}
  ;

function Post(id) {
  this.id = id;
  this.element = $(id) || null;
}
Post.implement({
  getAnd: function (callback) {
    var self = this;

    if (self.element) {
      callback(self);
    } else {
      new Request.HTML({
        url: '/res/' + window.boardName + '/post/' + self.id,
        onSuccess: function (responseTree) {
          var post = Array.from(responseTree).filter(function (el) {
            return el.match && el.match('article')
          })[0];
          self.element = post;
          if (!$(self.id)) {
            postCache.grab(post); // prerenders
          }
          callback(self);
        }
      }).get();
    }
  },
});


function Thread(thread) {
  if (typeOf(thread) === 'string') {
    this.id = thread;
    this.element = $('thread_' + thread) || null;
  } else {
    this.id = thread.id;
    this.element = thread;
  }
  this.graph = null;
}

Thread.implement({
  getAnd: function (callback) {
    var self = this
      , omitted = self.omitted()
      , actualLength = self.posts().length
      , requiredLength = omitted ? +omitted.dataset.posts + 4 : actualLength
    ;
    
    if (requiredLength <= actualLength) {
      callback(self);
    } else {
      new Request.HTML({
        url: '/res/' + window.boardName + '/thread/' + this.id,
        onSuccess: function (responseTree) {
          if (!self.element) {
            self.element = responseTree[0];
          } else {
            self.cache().adopt(responseTree[0]
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

          callback(self);
        }
      }).get();
    }
  },

  posts: function () {
    return this.element
      .getElements('article')
      .sort(function (a, b) {
        return +a.id - b.id
      });
  },

  omitted: function () {
    return this.element.getElement('.omittedposts');
  },

  cache: function () {
    return this.element.getElementById('cache_' + this.id);
  },

  addPost: function (el) {
    var refs = el.getElements('a[onclick^=highlightPost]');
    this.graph.append(
      refs.map(getTarget)
        .sort()
        .unique()
        .filter(function (x) {
          return !!$(x);
        }),
      el.id);
  },

  postGraph: function (regenerate) {
    if (!this.graph)
      this.graph = graphCache[this.id];
    if (!this.graph || regenerate) {
      this.graph = graphCache[this.id] = new DAG(this.id);
      this.posts().forEach(this.addPost.bind(this));
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
