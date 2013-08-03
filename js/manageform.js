window.addEvent('domready', function () {
  function updateForm() {
    var checked = $$('main input[name=posts]:checked');
    if (checked.length) {
      $('toolbox').removeClass('inactive');
    } else {
      $('toolbox').addClass('inactive');
    }
    $('toolbox_references').empty().adopt(checked.map(function (el) {
      return new Element('a.reflink', {
        href: '#' + el.get('value'),
        text: ' >>' + el.get('value')
      });
    }));
  }

  updateForm();
  $$('main').addEvent('change:relay(input[name=posts])', updateForm);
});
