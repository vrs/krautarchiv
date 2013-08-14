window.addEvent('domready', function () {
  function updateContainer(tgt) {
    var parent = tgt.getParents('.post')[0];

    parent.toggleClass('hasexpanded',
      !!parent.getElements('.expanded').length)
  }

  function toggleExpand(img) {
    var figure = img.getParents('figure')[0];

    if (img.hasClass('smallthumb')) {
      img.clone()
        .removeClass('smallthumb')
        .addClass('bigthumb')
        .set('src', img.get('src').replace('/thumb', ''))
        .inject(img.getParent());
      figure.addClass('expanded');
      updateContainer(img);
    } else {
      figure.removeClass('expanded');
      updateContainer(img);
      img.destroy();
    }
  }

  $$('main').addEvent(
    'click:relay(div.thumbnail img)',
    function (ev, target) {
      if (!ev.control && !ev.shift && !ev.alt && !ev.meta && ev.event.which === 1) {
        ev.preventDefault();
        toggleExpand(target);
      }
    });
});
