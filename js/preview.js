var preview = (function () {
  var previewBox = new Element('div.invisible#preview')
    , state = {}
  ;

  function hoverNear(el, ref) {
    var coords = ref.getCoordinates()
      , fixed = ref.getOffsetParent().getStyle('position') === "fixed"
      , pv = previewBox.empty().grab(el).inject(document.body)
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
        .removeHooks('load')
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
            hoverNear(post.clone(), ref);
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
      'click:relay(a[onclick^=highlightPost], span.reflink > a)': function (ev, tgt) {
        tgt.removeClass('progress');
        preview.hide(getTarget(tgt));
      },
    });
})
