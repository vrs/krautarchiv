window.addEvent('domready', function () {
  function deselect(ev) {
    ev.preventDefault();
    $$('main input[name=posts]:checked').invoke('set', 'checked', false);
    updateForm();
  }

  function updateForm() {
    var checked = $$('main input[name=posts]:checked');
    if (checked.length) {
      $('toolbox').removeClass('invisible');
    } else {
      $('toolbox').addClass('invisible');
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
  }

  $('posts_deselect').addEvent('click', deselect);
  updateForm();
  $$('main').addEvent('change:relay(input[name=posts])', updateForm);
});
