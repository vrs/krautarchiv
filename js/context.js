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

function grabPost(original) {
  var id = original.get('id');

  new Element('div.post.thread_reply.replaced#replaced_' + id)
    .grab(new Element('span.reflink', {
      html: "[<a href=\"#" + id + "\">&gt;&gt;" + id + "</a>]"
    }))
    .replaces(original);

  return original;
}

function restorePost(replacement) {
  var id = getTarget(replacement.getElement('span.reflink a'));
  $(id).replaces(replacement);
}

board.Thread.implement({
  showContext: function (lensId, focusId) {
    this.focus = new board.Post(focusId);
    this.lens = new board.Post(lensId);
    var lns = this.lens.element
      , foc = this.focus.element
      , graph = this.postGraph()
      , ancbox = new Element('div.ancbox.context')
      , desbox = new Element('div.desbox.context')
      , ancestors
      , descendants
    ;
    lns.getElement('.bullet a').set('text', "<<");
    foc.getElement('.bullet a').set('text', "<<");
    if (foc.getParent('.cache')) {
      this.element
        .getElement('.omittedposts')
        .grab(grabPost(foc), 'after');
    }

    ancestors = graph.ancestors(lensId).flatten().erase(lensId);
    descendants = graph.descendants(lensId).flatten().erase(lensId);

    ancbox.adopt(ancestors.map($).map(grabPost));
    desbox.adopt(descendants.map($).map(grabPost));

    lns.grab(ancbox, 'before');
    if (+focusId < +lensId)
        lns.grab(foc, 'before');
    lns.grab(desbox, 'after');
    if (+focusId > +lensId)
        lns.grab(foc, 'after');
  },
  flatten: function () {
    this.element.getElements('.replaced').forEach(restorePost);
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
