window.addEvent('domready', function () {
  function expand(num, callback) {
    new board.Thread(num)
      .onLoad(function (thread) {
        var cached = $('cache_' + num).getChildren('article')
        thread.omitted().addClass('shown');
        thread.element.adopt(
          cached.concat(
            thread.posts().slice(1).invoke('dispose')));
        callback();
      })
      .load();
  }

  function condense(num, callback) {
    var thread = new board.Thread(num)
      , posts = thread.posts().slice(1)
    ;
    thread.omitted().removeClass('shown');
    thread.element.adopt(posts.splice(-3, 3));
    thread.cache().adopt(posts);
    callback();
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
      target.addClass('progress');
      action(num, function () {
        target.removeClass('progress');  
      });
    }
  );
});
