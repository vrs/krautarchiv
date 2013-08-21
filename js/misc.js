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
    var data;
    try {
      data = window.localStorage.getItem(key);
    } catch (e) {
      log.log('error', "Couldn't read localStorage. Have you enabled cookies?");
    }
    this[key] = data ? JSON.parse(data) : fallback;
  },
  save: function (key) {
    try {
      window.localStorage.setItem(key, JSON.stringify(this[key]));
    } catch (e) {
      log.log('error', "Couldn't save data in localStorage. Have you enabled cookies?");
    }
  },
}


// set up titles
window.addEvent('domready', function () {
  var tips = new Tips({
    className: 'tooltip',
    text: null
  });
  $$('main, nav').addEvents({
    // hack for delegation
    'mouseenter:relay(a[title], abbr[title])': function addTip(ev, tgt) {
      if (!tgt.retrieve('tip:title')) {
        tips.attach(tgt);
        tips.elementEnter(ev, tgt);
      }
    }
  });
});


// make js-based features only visible when JS is actually enabled
window.addEvent('domready', function () {
  document.body.addClass('jsenabled');
});

// scroll preserver for various features
var scrolls = {
  save: function (el) {
    var pos = el.getPosition();
    el.store('scroll', pos.y - window.scrollY);
  },
  restore: function (el) {
    var pos = el.getPosition(),
      scroll = el.retrieve('scroll')
    ;
    window.scrollTo(0, pos.y - scroll);
  },
  intoview: function (el) {
    var coords = el.getCoordinates()
      , height = window.getSize().y
    ;
    if (coords.bottom > window.scrollY + height) {
      el.scrollIntoView(coords.height > height);
    }
    if (coords.top < window.scrollY) {
      el.scrollIntoView(true);
    }
  }
};

// util
function getTarget (a) {
  return a.get('href').match(/\d+/g).pop();
}
