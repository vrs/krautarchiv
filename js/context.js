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

// works in threads only. TODO
var context = (function () {
  function exclude (arr, without) {
    return arr.filter(function (x) {
      return !(without.indexOf(x) >= 0);
    })
  }

  return {
    focus: null,
    show: function (num, highlight) {
      this.focus = $(num);
      var graph = new board.Thread(this.focus.getParent()).postGraph()
        , ancwrap = $('ancwrap') || new Element('div#ancwrap.context', { html: '<div id=ancbox>' })
        , deswrap = $('deswrap') || new Element('div#deswrap.context', { html: '<div id=desbox>' })
        , ancbox = ancwrap.firstChild.empty()
        , desbox = deswrap.firstChild.empty()
        , dummy = new Element('div#dummy.dummy')
        , ancestors
        , descendants
      ;

      ancestors = exclude(graph.ancestors(num).flatten(), [num]);
      descendants = exclude(graph.descendants(num).flatten(), [num]);

      ancbox.adopt(ancestors.map($).map(grabPost));
      desbox.adopt(descendants.map($).map(grabPost));

      if (ancestors.length) this.focus.grab(ancwrap, 'before');
      this.focus.grab(deswrap, 'after');
      if (highlight)
        $(highlight).addClass('highlight');
    },
    hide: function () {
      if (this.focus) {
        this.focus.getElement('.bullet a').set('text', ">>");
        this.focus = null;
      }
      $$('.replaced').forEach(restorePost);
      $$('#ancwrap, #deswrap').dispose()
    }
  }
})();


window.addEvent('domready', function() {
  var main = $$('main')[0];

  if (main)
    main.addEvent('click:relay(a[onclick^=highlightPost], span.reflink > a, .bullet > a)',
      function (ev, tgt) {
        var id = getTarget(tgt)
          , post = tgt.getParent('article')
          , thread = post && post.getParent('article')
          , same = context.focus && post.id === context.focus.id
        ;

        if (tgt.get('href').contains('#q'))
          return;
        if (!post)
          return;
        if (thread.getElementById(id) && window.threadNum) {
          if (tgt.match('.bullet > a') && !same)
            tgt.set('text', "<<");

          ev.preventDefault();
          scrolls.save(post);
          context.hide();
          if (!same)
            context.show(post.id, id);
          scrolls.restore(post);
        }
      }
    );
})
