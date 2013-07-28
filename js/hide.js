(function () {
  var killedPosts = JSON.parse(window.localStorage.getItem('kill'));
  if (killedPosts && killedPosts.length)
    document.head.appendChild(new Element('style', { type: 'text/css', html:
      killedPosts.map(function (n) {
        return '#thread_' + n + ', #thread_' + n + ' + hr, article[id="' + n + '"]'
      }).join(',\n') +
      ' {display: none;}' }));
})();

window.addEvent('domready', function () {
  function handle(action, persist) {
    return function (ev, target) {
      ev.preventDefault();
      var num = target.getProperty('href').match(/\d+/)[0]
        , type = target.getProperty('href').match(/[a-z]+(_recursive)?/)[0]
        , post = $(num)
      ;
      if (post.hasClass('thread_OP')) {
        action(post.getParent('article'))
      } else {
        action(post);
      }
      if (persist)
        setTimeout(function () {
          if (type.indexOf('hide'))
            window.localStorage.setItem('kill', JSON.stringify(persist(num,
              JSON.parse(window.localStorage.getItem('kill')) || [])));
          if (type.indexOf('kill'))
            window.localStorage.setItem('hide', JSON.stringify(persist(num,
              JSON.parse(window.localStorage.getItem('hide')) || [])));
        });
    }
  }

  // right now the CSS for .hidden is too complex to dynamically generate
  // does it matter anyway?
  (JSON.parse(window.localStorage.getItem('hide')) || []).forEach(function (num) {
    var post;
    if (post = $(num)) {
      if (post.hasClass('thread_OP'))
        post = post.getParent('article');
      post.addClass('hidden');
    }
  });


  document.body.addEvents({
    'click:relay(a[href^=#hide_])': handle(function (el) {
      el.addClass('hidden');
    }, function (num, arr) {
      arr.push(num);
      return arr;
    }),
    'click:relay(a[href^=#kill_])': handle(function (el) {
      el.addClass('killed');
    }, function (num, arr) {
      arr.push(num);
      return arr;
    }),
    'click:relay(a[href^=#show_])': handle(function (el) {
        el.removeClass('hidden').removeClass('killed');
    }, function (num, arr) {
      return arr.filter(function (x) {
        return x !== num;
      });
    }),
  });
});
