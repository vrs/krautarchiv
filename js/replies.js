settings.register({
  name: "replies",
  group: "browsing",
  options: [{
    name: "enable",
    description: "Show replies to posts",
    defaultValue: true,
  }],
});

if (settings.store.replies.enable) window.addEvent('domready', function () {
  function linkFromId(id) {
    return new Element('span.reflink', {
      html: "<a href=\"#" + id + "\">&gt;&gt;" + id + "</a>"
    });
  }

  function addReplies(replyEl, refs) {
    replyEl.empty().adopt(
      new Element('span.replies', { text: "Replies: " }),
      refs.map(linkFromId)
    );
  }

  function decorateThread(thread) {
    var graph = thread.postGraph(true)
      , articles = thread.element.getElements('article')
    ;

    // TODO sane selectors
    thread.element.getElements('a[onclick^=highlightPost]').filter(function (a) {
      return thread.id === getTarget(a);
    }).invoke('addClass', 'thread_OP');
    thread.element.getElements('.post_replies').forEach(function (replies, i) {
      var id = new board.Post(articles[i]).id
        , children = (id in graph.nodes) && graph.nodes[id].children
      ;
      if (children && children.length)
        addReplies(replies, children);
    });
  }

  $$('article.thread').forEach(function (threadEl) {
    var thread = new board.Thread(threadEl);

    decorateThread(thread);
    thread.onLoad(decorateThread);
  });
});
