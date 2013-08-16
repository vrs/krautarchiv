window.addEvent('domready', function () {
  function updateContainer(tgt) {
    var parent = tgt.getParent('.post');

    parent.toggleClass('hasexpanded',
      !!parent.getElements('.expanded').length)
  }

  function toggleExpand(img) {
    var figure = img.getParent('figure')
      , a = img.getParent()
      , src = img.get('src')
    ;

    scrolls.save(a);
    if (img.hasClass('smallthumb')) {
      a.setStyles({
        'min-width': img.offsetWidth,
        'min-height': img.offsetHeight,
        'background-size': 'cover',
        'background-image': 'url("' + window.location.origin + src + '")',
      });
      img.clone()
        .removeClass('smallthumb')
        .addClass('bigthumb')
        .addEvent('load', function (ev) {
          scrolls.intoview(figure);
        })
        .set('src', src.replace('/thumb', ''))
        .inject(a)
      ;
      figure.addClass('expanded');
      updateContainer(img);
      scrolls.restore(a);
    } else {
      a.set('style', '');
      figure.removeClass('expanded');
      updateContainer(img);
      img.destroy();
      scrolls.restore(a);
      scrolls.intoview(figure);
    }
  }

  $$('main:not(.catalog)').addEvent(
    'click:relay(div.thumbnail img)',
    function (ev, target) {
      if (!ev.control && !ev.shift && !ev.alt && !ev.meta && ev.event.which === 1) {
        ev.preventDefault();
        toggleExpand(target);
      }
    });
});
