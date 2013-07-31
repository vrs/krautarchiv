storage.load('hidden', {});
storage.load('killed', {});

(function () {
  if (Object.getLength(storage.killed)) {
    document.head.appendChild(new Element('style[type=text/css]', {
      html: Object.keys(storage.killed).map(function (n) {
        return '#thread_' + n + ', #thread_' + n + ' + hr, article[id="' + n + '"]'
      }).join(',\n') + ' {display: none;}'
    }));
  }
})();

window.addEvent('domready', function () {
  function hide(post, reason) {
    var num = post.get('id')
      , tgt = post.hasClass('thread_OP') ? post.getParent('article') : post
    ;
    reason = reason || "";
    tgt.addClass('hidden')
      .getElement('.reason')
      .set('text', reason);
    storage.hidden[num] = reason;
  }

  function show(post) {
    var num = post.get('id')
      , tgt = post.hasClass('thread_OP') ? post.getParent('article') : post
    ;
    tgt.removeClass('hidden').removeClass('killed');
    tgt.getElement('.reason').empty();
    delete storage.hidden[num];
    delete storage.killed[num];
  }

  function kill(post) {
    var num = post.get('id')
      , tgt = post.hasClass('thread_OP') ? post.getParent('article') : post
    ;
    tgt.addClass('killed');
    storage.killed[num] = 1;
  }

  // right now the CSS for .hidden is too complex to dynamically generate
  // does it matter anyway?
  Object.each(storage.hidden, function (reason, num) {
    var post;
    if (post = $(num)) {
      if (post.hasClass('thread_OP'))
        post = post.getParent('article');
      hide(post, reason);
    }
  });


  document.body.addEvent(
    'click:relay(a[href^=#hide_], a[href^=#kill_], a[href^=#show_])',
    function (ev, target) {
      ev.preventDefault();
      var params = target.getProperty('href').match(/#([a-z]+)(_recursive)?_(\d+)$/)
        , type = params[1]
        , recursive = !!params[2]
        , num = params[3]
        , post = $(num)
        , action = ({ hide: hide, kill: kill, show: show })[type]
      ;

      action(post, 'manually');
      if (recursive) {
        postGraph(post.getParent('article'))
          .descendants(num)
          .flatten()
          .slice(1) // no need to be redundant
          .map(String.from)
          .forEach(function (n) {
            action($(n), "auto >>" + num + " ff.");
          });
      }

      setTimeout(function () {
        // save but don't waste time with mutually exclusive accesses
        if (type !== 'hide')
          storage.save('killed')
        if (type !== 'kill')
          storage.save('hidden')
      });
    });
});
