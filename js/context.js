window.highlightPost = function highlightPost(){} // TODO sigh

settings.register({
  name: "context",
  group: "browsing",
  options: [{
    name: "enable",
    description: "Show ancestor/descendant posts when clicking post links",
    defaultValue: true,
  }],
});

if (settings.store.context.enable) { (function () {

board.Thread.implement({
  pullPost: function (original) {
    var id = original.get('id')
      , placeholder = new Element('div.post.thread_reply.replaced#replaced_' + id)
        .grab(new Element('span.reflink', {
          html: "[<a href=\"#" + id + "\">&gt;&gt;" + id + "</a>]"
        }))
      ;
    if (id === this.id) { // OP is immovable
      placeholder.getElement('span.reflink a').addClass('thread_OP');
      return placeholder;
    } else {
      placeholder.replaces(original);
      return original;
    }
  },

  restorePost: function (placeholder) {
    var id = getTarget(placeholder.getElement('span.reflink a'));
    if (id === this.id) {
      placeholder.dispose();
    } else {
      $(id).replaces(placeholder);
    }
  },


  showContext: function (lensId, focusId) {
    this.focus = new board.Post(focusId); // referenced post
    this.lens = new board.Post(lensId); // "source" post
    var lns = this.lens.element
      , foc = this.focus.element
      , graph = this.postGraph()
      , ancbox = new Element('div.ancbox.context')
      , desbox = new Element('div.desbox.context')
      , ancestors
      , descendants
      , pullPost = this.pullPost.bind(this)
    ;
    lns.getElement('.bullet a').set('text', "<<");
    foc.getElement('.bullet a').set('text', "<<");
    if (foc.getParent('.cache')) {
      this.element
        .getElement('.omittedposts')
        .grab(pullPost, 'after');
    }

    ancestors = graph.ancestors(focusId).flatten().erase(focusId).erase(lensId);
    descendants = graph.descendants(focusId).flatten().erase(focusId).erase(lensId);

    ancbox.adopt(ancestors.map($).map(pullPost));
    desbox.adopt(descendants.map($).map(pullPost));

    lns.grab(ancbox, 'before');
    if (focusId <+ lensId)
      lns.grab(pullPost(foc), 'before');
    lns.grab(desbox, 'after');
    if (focusId >+ lensId)
      lns.grab(pullPost(foc), 'after');
  },

  flatten: function () {
    this.element.getElements('.replaced').forEach(this.restorePost.bind(this));
    this.element.getElements('.ancbox, .desbox').dispose()
    if (this.lens && this.focus) {
      this.lens.element.getElement('.bullet a').set('text', ">>");
      this.focus.element.getElement('.bullet a').set('text', ">>");
      this.focus = this.lens = null;
    }
  },
});


window.addEvent('domready', function() {
  $$('main').addEvent('click:relay(a[onclick^=highlightPost], span.reflink > a, .bullet > a)',
    function (ev, tgt) {
      var focusId = getTarget(tgt)
        , post = tgt.getParent('article')
        , lensId = post.get('id')
        , thread = new board.Thread(post.getParent('article'))
      ;

      function focus() {
        var oldfocus = thread.focus
          , oldlens = thread.lens;
        scrolls.save(tgt);
        scrolls.save(thread.element);
        thread.flatten();
        if (!oldfocus && !oldlens) { // no context is shown already
          thread.showContext(lensId, focusId);
        } else if (oldlens.id === focusId && oldlens.id === lensId) { // "<<"
        } else if (oldfocus.id !== focusId) {
          thread.showContext(lensId, focusId);
        } else { // same link and post
        }
        if (scrolls.restore(tgt) < 0) {
          scrolls.restore(thread.element);
          scrolls.intoview(thread.element);
        }
      }

      if (tgt.get('href').contains('#q'))
        return;
      if (!post)
        return;
      ev.preventDefault();
      // TODO check parent of post
      if ($(focusId) && $(focusId).getParent('article')) {
        focus()
      } else {
        tgt.addClass('progress');
        thread.onLoad(function updateGraph(thread) {
          thread.removeHook('load', updateGraph);
          thread.postGraph(true);
        }).onGet(function me(thread) {
          thread.removeHook('get', me);
          tgt.removeClass('progress');
          focus();
        }).get();
      }
  });
})
})() }
