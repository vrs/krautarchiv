window.addEvent('domready', function () {
  function expand(num) {
    var thread = $('thread_' + num)
      , omitted = thread.getElement('.omittedposts')
      , cached = $('cache_' + num).getChildren('article')
    ;
    if (cached.length >= omitted.dataset.posts) {
      omitted.addClass('shown');
      thread.adopt(
        cached.concat(
          thread.getChildren('article:not(.thread_OP)')
            .dispose())
      );
    } else {
      new Request.HTML({
        url: '/res/' + window.boardName + '/thread/' + num,
        onSuccess: function (responseTree) {
          var replies = responseTree[0].getChildren('article').slice(1);
          omitted.addClass('shown')
            .getAllNext()
            .dispose();
          thread.adopt(replies);
        }
      }).get();
    }
  }

  function condense(num) {
    var thread = $('thread_' + num);
    thread.getElement('.omittedposts').removeClass('shown');
    thread.adopt(
      thread.getChildren('article:not(.thread_OP)')
        .dispose()
        .sort(function (a, b) {
          return +a.id - b.id
        })
        .invoke('inject', $('cache_' + num))
        .slice(-3)
    );
  }

  $$('main:not(.catalog)').addEvent(
    'click:relay(a[href^=#expandthread_], a[href^=#condensethread_])',
    function (ev, target) {
      ev.preventDefault();
      var params = target.getProperty('href').match(/#([a-z]+)_(\d+)$/)
        , type = params[1]
        , num = params[2]
        , action = ({ condensethread: condense, expandthread: expand})[type]
      ;
      action(num);
    }
  );
});
