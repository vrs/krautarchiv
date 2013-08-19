window.addEvent('domready', function () {
  $$('article.thread').forEach(function (thread) {
    var graph = new board.Thread(thread).postGraph()
      , articles = thread.getElements('article');
    thread.getElements('.post_replies').forEach(function (replies, i) {
      var id = articles[i].get('id')
        , children = (id in graph.nodes) && graph.nodes[id].children
      ;
      if (children && children.length) {
        replies.adopt(
          new Element('span.replies', { text: "Replies: " }),
          children.map(function (id) {
            return new Element('span.reflink', {
              html: "<a href=\"#" + id + "\">&gt;&gt;" + id + "</a>"
            });
          })
        );
      }
    });
  });
});
