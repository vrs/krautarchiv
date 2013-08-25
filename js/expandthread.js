settings.register({
  name: "expandthreads",
  group: "browsing",
  options: [{
    name: "enable",
    description: "Enable inline thread expansion",
    defaultValue: true,
  }],
});

if (settings.store.expandthreads.enable) {
window.addEvent('domready', function () {
  function expand(num, callback) {
    new board.Thread(num)
      .onGet(function me(thread) {
        thread.removeHook('get', me);
        var cached = $('cache_' + num).getChildren('article')
        thread.omitted().addClass('shown');
        thread.element.adopt(
          cached.concat(
            thread.posts().slice(1).invoke('dispose')));
        callback();
      })
      .get();
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
} else {
  document.head.appendChild(new Element('style[type=text/css]', {
    text: 'span.link_expandthread {display: none;}'
  }));
}
