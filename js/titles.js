window.addEvent('domready', function () {
  // TODO delegation (don't bother now)
  var tips = new Tips('a[title]', {
    className: 'tooltip',
    offset: {x: 15, y: 1},
    text: null
  });
});
