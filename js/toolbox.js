var mngform = {
  update: function () {
    var checked = $$('main input[name=posts]:checked');
    if (checked.length) {
      $('toolbox_manage').removeClass('collapsed');
    } else {
      $('toolbox_manage').addClass('collapsed');
    }
    $('toolbox_references').empty().adopt(checked.map(function (el) {
      var id = el.get('value')
        , data = $(id).dataset
        , $t = document.createTextNode.bind(document) // srsly?
      ;
      return new Element('span.ref').adopt([
        new Element('a.reflink', {
          href: '#' + id,
          text: '>>' + id,
          onclick: 'highlightPost' // hack
        }),
        $t(' '),
        new Element('abbr.ip', {
          text: data.ip,
          title: data.hostname
        }),
        $t(' '),
      ]);
    }));
    toolbox.update();
  },
  clearPosts: function (ev) {
    ev.preventDefault();
    $$('main input[name=posts]:checked').invoke('set', 'checked', false);
    this.update();
  }

}, log = {
  update: function () {
    var container = $('toolbox_logbox');
    if ($('toolbox_log').getFirst())
      container.removeClass('collapsed');
    else
      container.addClass('collapsed');
    toolbox.update();
  },
  log: function (level, msg) {
    var logEl = $('toolbox_log')
      , loglengthEl = $('toolbox_loglength')
      , loglength = 0
    ;
    if (!logEl) return;
    logEl.grab(new Element('div', {
      'class': level,
      html: "<time>" + new Date().toISOString() + "</time> " + msg
    }), 'top');
    if ((loglength = logEl.getChildren().length) > 3) {
      loglengthEl.set('text', "(" + loglength + " Entries)");
    } else {
      loglengthEl.set('text', '');
    }
    this.update();
  },
  clear: function (ev) {
    ev.preventDefault();
    $('toolbox_log').empty();
    this.update();
  }

}, toolbox = {
  update: function () {
    var toolbox = $('toolbox');
    if (toolbox.getFirst(':not(.collapsed)'))
      toolbox.removeClass('collapsed');
    else
      toolbox.addClass('collapsed');
  }
};
  
window.addEvent('domready', function () {

  $('posts_deselect').addEvent('click', mngform.clearPosts.bind(mngform));
  $('log_clear').addEvent('click', log.clear.bind(log));
  mngform.update();
  $$('main').addEvent('change:relay(input[name=posts])', mngform.update.bind(mngform));
});
