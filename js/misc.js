/* uncommon conventions:
 * '' for internal strings, "" for strings the user sees
 * var statements: see existing code
 * indentation: 2 spaces
 * one empty line: new paragraph
 * two empty lines: new section
 * three empty lines: other feature. use a new file instead.
 */

// storing the wrong keys will clobber functions.
// You were warned.
var storage = {
  load: function (key, fallback) {
    var data = window.localStorage.getItem(key);
    this[key] = data ? JSON.parse(data) : fallback;
  },
  save: function (key) {
    window.localStorage.setItem(key, JSON.stringify(this[key]));
  },
}


// set up titles
// TODO delegation (don't bother now)
// TODO kill tooltip after post is hidden
window.addEvent('domready', function () {
  var tips = new Tips('a[title]', {
    className: 'tooltip',
    text: null
  });
});


// make js-based features only visible when JS is actually enabled
window.addEvent('domready', function () {
  document.body.addClass('jsenabled');
});
