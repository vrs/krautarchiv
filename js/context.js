window.highlightPost = function highlightPost(){} // TODO sigh

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
  focusPost: function (id) {
    this.focus = new board.Post(id);
    var foc = this.focus.element
      , graph = this.postGraph()
      , ancbox = new Element('div.ancbox.context')
      , desbox = new Element('div.desbox.context')
      , ancestors
      , descendants
    ;
    foc.getElement('.bullet a').set('text', "<<");
    if (foc.getParent('.cache')) {
      this.element
        .getElement('.omittedposts')
        .grab(grabPost(foc), 'after');
    }

    ancestors = graph.ancestors(id).flatten().erase(id);
    descendants = graph.descendants(id).flatten().erase(id);

    ancbox.adopt(ancestors.map($).map(grabPost));
    desbox.adopt(descendants.map($).map(grabPost));

    foc.grab(ancbox, 'before');
    foc.grab(desbox, 'after');
  },
  defocusPost: function () {
    this.element.getElements('.replaced').forEach(restorePost);
    this.element.getElements('.ancbox, .desbox').dispose()
    if (this.focus) {
      this.focus.element.getElement('.bullet a').set('text', ">>");
      this.focus = null;
    }
  },
});


window.addEvent('domready', function() {
  $$('main').addEvent('click:relay(a[onclick^=highlightPost], span.reflink > a, .bullet > a)',
    function (ev, tgt) {
      var id = getTarget(tgt)
        , post = tgt.getParent('article')
        , thread = new board.Thread(post.getParent('article'))
      ;

      function focus() {
        var tempfocus = thread.focus;
        scrolls.save(tgt);
        scrolls.save(thread.element);
        thread.defocusPost();
        if (!tempfocus || tempfocus.id !== id)
          thread.focusPost(id);
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
      if ($(id) && $(id).getParent('article')) {
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
