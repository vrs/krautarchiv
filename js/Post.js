board.Post = new Class({
  Extends: board.Resource,
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

board.postCache = new Element('div.cache#post_cache');
window.addEvent('domready', function () {
  board.postCache.inject(document.body);
});

board.Post.implement({

  clone: function() {
    // returns a plain element, no need to overengineer yet
    var post = this.element.clone();
    return post.set('id', 'c' + this.id).removeClass('hidden');
  },

  isCached: function () {
    return !!this.element;
  },

  parseResource: function (responseTree) {
    var element = Array.from(responseTree).filter(function (el) {
      return el.match && el.match('article')
    })[0];
    if (!$(element.id)) {
      board.postCache.grab(element); // prerenders
    }
    this.element = $(element.id);
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
