window.highlightPost = function highlightPost(){} // TODO sigh

function getTarget (a) {
  return a.get('href').match(/\d+/g).pop();
}

function clonePost (p) {
  var post = p.clone();
  post.set('id', 'c' + p.id);
  // TODO eww
  post.getElements('a[onclick^=highlightPost]').forEach(function (el) {
    el.set('href', el.get('href').replace('#','#c'))
  });
  return post;
}

var postCache
  , preview = (function () {
      var previewBox = new Element('div.invisible[id=preview]')
        , status = []
      ;

      function loadPost(num, callback) {
        new Request.HTML({
          url: '/res/' + window.boardName + '/post/' + num,
          onSuccess: function (responseTree) {
            var post = Array.from(responseTree).filter(function (el) {
              return el.match && el.match('article')
            })[0];
            if (!$(num)) {
              postCache.grab(post);
            }
            post.addClass('highlight');
            callback(post);
          }
        }).get();
      }

      function showPost(post, ref) {
        var coords = ref.getCoordinates()
          , fixed = ref.getOffsetParent().getStyle('position') === "fixed"
          , pv = previewBox.empty().grab( clonePost(post) ).inject(document.body)
        ;
        if (fixed) {
          pv.position({
            relativeTo: ref,
            edge: 'bottomLeft',
            position: 'upperLeft',
            offset: { x: 0, y: -5 },
          }).pin();
        } else {
          pv.position({
            relativeTo: ref,
            edge: 'centerLeft',
            position: 'centerRight',
            offset: { x: 5, y: 0 },
            minimum: { y: window.scrollY + 5 },
            // neasures too early. doesn't seem to be a problem?
            maximum: { y: window.scrollY + window.getSize().y - pv.getSize().y - 5 },
          });
        }
        pv.removeClass('invisible');
      }

      return {
        show: function (num, ref, callback) {
          if ($(num))
            $(num).addClass('highlight');
          
          var p = $('c'+num) || $(num)
            , size = window.getSize()
            , coords = p && p.getCoordinates()
            , isVisible = p && coords.bottom > window.scrollY &&
              window.scrollY + size.y > coords.top
            , isEntirelyVisible = p && coords.top > window.scrollY &&
              window.scrollY + size.y > coords.bottom
          ;

          if (p) {
            if (!isEntirelyVisible) {
              showPost(p, ref);
            }
            if (isVisible) {
              p.addClass('highlight');
            }
            callback();
          } else {
            if (!status[+num]) {
              loadPost(num, function (post) {
                if (status[+num] !== "aborted") {
                  showPost(post, ref);
                  callback();
                  status[+num] = "loaded";
                }
              });
            }
            status[+num] = "loading";
          }
        },
        hide: function (num) {
          var posts = $$('#' + num + ',#c' + num);
          status[+num] = "aborted";
          posts.removeClass('highlight');
          previewBox.addClass('invisible').unpin().empty();
        }
      };
    })()
  // works in threads only. TODO
  , context = (function () {
      function exclude (arr, without) {
        return arr.filter(function (x) {
          return !(without.indexOf(x) >= 0);
        })
      }

      return {
        show: function (num, highlight) {
          var posts = $$('article article')
            , graph = postGraph($$('.thread')[0])
            , ancwrap = $('ancwrap') || new Element('div#ancwrap.context', { html: '<div id=ancbox>' })
            , deswrap = $('deswrap') || new Element('div#deswrap.context', { html: '<div id=desbox>' })
            , ancbox = ancwrap.firstChild.empty()
            , desbox = deswrap.firstChild.empty()
            , dummy = new Element('div#dummy.dummy')
            , ancestors
            , descendants
          ;
          
          descendants = exclude(graph.descendants(num).flatten(), [num]);
          ancestors = exclude(graph.ancestors(num).flatten(), [num]);
          
          ancestors.forEach(function (i) {
              ancbox.grab(clonePost($(''+i)));
              $(''+i).addClass('inactive');
          });
          descendants.forEach(function (i) {
              desbox.grab(clonePost($(''+i)));
              $(''+i).addClass('inactive');
          });

          ancbox.getFirst('#c' + highlight).addClass('highlight');
          if (ancestors.length) $(num).grab(ancwrap, 'before');
          if (descendants.length) $(num).grab(deswrap, 'after');
      },
      hide: function () {
          $$('#ancwrap, #deswrap').dispose()
          $$('main article.inactive').removeClass('inactive');
        }
      }
    })()
;


window.addEvent('domready', function() {
  var main = $$('main')[0];
  postCache = new Element('div[id=post_cache]').inject(document.body);
  
  if (main)
    main.addEvents({ // TODO eww
      'mouseenter:relay(a[onclick^=highlightPost])': function (ev, tgt) {
        tgt.addClass('progress');
        preview.show(getTarget(tgt), tgt, tgt.removeClass.bind(tgt, 'progress'));
      },
      'mouseleave:relay(a[onclick^=highlightPost])': function (ev, tgt) {
        tgt.removeClass('progress');
        preview.hide(getTarget(tgt));
      },
      'click:relay(a[onclick^=highlightPost])': function (ev, tgt) {
        var id = getTarget(tgt);

        if ($$('main #' + id).length && window.threadNum) {
          var post = tgt.getParent('article');
          if (!post)
            return;
          ev.preventDefault();
          if (!tgt.match('.context *')) {
            preview.hide(getTarget(tgt));
            context.hide();
            context.show(post.id, id);
          }
        }
      }
    });
    document.body.addEvent('click', function (ev) {
      if (!ev.target.match('.context, .context *, a[onclick^=highlightPost]')) {
        context.hide();
      }
    });
})
