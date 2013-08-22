var preview = (function () {
  var previewBox = new Element('div.invisible#preview')
    , state = {}
  ;

  function hoverNear(el, ref) {
    var fixed = ref.getOffsetParent().getStyle('position') === "fixed"
      , pv = previewBox.empty().grab(el).inject(document.body)
    ;
    pv.store('pin:_pinned', false); // reset state to avoid expensive .unpin()
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
        minimum: { y: window.pageYOffset + 5 },
        // neasures too early. doesn't seem to be a problem?
        maximum: { y: window.pageYOffset + window.getSize().y - pv.getSize().y - 5 },
      });
    }
    pv.removeClass('invisible');
  }

  function showOrHighlight (post, ref) {
    var p = post.element
      , size = window.getSize()
      , rect = p.getBoundingClientRect()
      , isVisible = rect.bottom > 0 && rect.top < size.y
      , isEntirelyVisible = rect.top > 0 && rect.bottom < size.y
    ;

    if (isVisible && !ref.getParent().getParent('.postdata')) {
      p.addClass('highlight');
    }
    if (!isEntirelyVisible || p.hasClass('hidden') ) {
      p.addClass('highlight');
      hoverNear(post.clone(), ref);
    }
  }

  return {
    show: function (ev, tgt) { 
      var id = getTarget(tgt);

      if (!state[id]) {
        state[id] = { hover: true, loading: true };
      } else {
        state[id].hover = true;
        if (state[id].loading)
          return;
      }
      tgt.addClass('progress');

      new board.Post(id)
        .removeHooks('load')
        .onLoad(function (post) {
          state[id].loading = false;
          if (!state[id].hover)
            return;
          tgt.removeClass('progress');
          showOrHighlight(post, tgt)
        })
        .load();
    },

    hide: function (ev, tgt) {
      var id = getTarget(tgt)
        , p = $(id)
      ;
      state[id].hover = false;
      if (!p)
        return;
      tgt.removeClass('progress');
      p.removeClass('highlight');
      previewBox.addClass('invisible').empty();
    }
  };
})()

window.addEvent('domready', function() {
  var main = $$('main')[0];

  if (main) main.addEvents({
      'mouseenter:relay(a[onclick^=highlightPost], span.reflink a)': preview.show,
      'mouseleave:relay(a[onclick^=highlightPost], span.reflink a)': preview.hide,
      'click:relay(a[onclick^=highlightPost], span.reflink > a)': preview.hide,
    });
})
