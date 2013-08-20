window.highlightPost = function highlightPost(){} // TODO sigh

function getTarget (a) {
  return a.get('href').match(/\d+/g).pop();
}

function clonePost (p) {
  // possible optimisation: cache clones
  var post = p.clone();
  post.set('id', 'c' + p.id)
    .removeClass('hidden');
  post.getElements('a[onclick^=highlightPost]').forEach(function (el) {
    el.set('href', el.get('href').replace('#','#c'))
  });
  return post;
}

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

var preview = (function () {
      var previewBox = new Element('div.invisible#preview')
        , state = {}
      ;


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
        show: function (id, ref, callback) {
          if (!state[id]) {
            state[id] = { hover: true, loading: true };
          } else {
            state[id].hover = true;
            if (state[id].loading)
              return;
          }

          new board.Post(id)
            .onLoad(function (post) {
              state[id].loading = false;
              if (!state[id].hover)
                return;

              var p = post.element
                , size = window.getSize()
                , coords = p.getCoordinates()
                , isVisible = coords.bottom > window.scrollY &&
                  window.scrollY + size.y > coords.top
                , isEntirelyVisible = coords.top > window.scrollY &&
                  window.scrollY + size.y > coords.bottom
              ;

              if (isVisible && !ref.getParent().getParent('.postdata')) {
                p.addClass('highlight');
              }
              if (!isEntirelyVisible || p.hasClass('hidden') ) {
                p.addClass('highlight');
                showPost(p, ref);
              }
              callback();
            })
            .load();
        },
        hide: function (id) {
          state[id].hover = false;
          var p = $(id);
          if (!p)
            return;
          p.removeClass('highlight');
          previewBox.addClass('invisible').empty();
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
    })()
;


window.addEvent('domready', function() {
  var main = $$('main')[0];

  if (main)
    main.addEvents({
      'mouseenter:relay(a[onclick^=highlightPost], span.reflink a)': function (ev, tgt) {
        tgt.addClass('progress');
        preview.show(getTarget(tgt), tgt, tgt.removeClass.bind(tgt, 'progress'));
      },
      'mouseleave:relay(a[onclick^=highlightPost], span.reflink a)': function (ev, tgt) {
        tgt.removeClass('progress');
        preview.hide(getTarget(tgt));
      },
      'click:relay(a[onclick^=highlightPost], span.reflink > a, .bullet > a)': function (ev, tgt) {
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
          if (tgt.match('.bullet > a')) {
            if (!same)
              tgt.set('text', "<<");
          } else {
            preview.hide(getTarget(tgt));
          }

          ev.preventDefault();
          scrolls.save(post);
          context.hide();
          if (!same)
            context.show(post.id, id);
          scrolls.restore(post);
        }
      },
    });
})
