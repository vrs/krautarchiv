window.addEvent('domready', function () {
  // TODO delegation (don't bother now)
  var tips = new Tips('a[title]', {
    className: 'tooltip',
    text: null
  });
});
