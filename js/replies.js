window.addEvent('domready', function () {
  $$('.thread').forEach(function (thread) {
    var graph = postGraph(thread)
      , articles = thread.getElements('article');
    thread.getElements('.post_replies').forEach(function (replies, i) {
      var id = articles[i].get('id')
        , children = graph.nodes[id].children
      ;
      if (children.length) {
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
