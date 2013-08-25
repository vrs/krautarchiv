storage.load('settings', {});

var settings = {
  register: function (spec) {
    this.specs.push(spec);
    if (!this.store[spec.name]) {
      this.store[spec.name] = {};
      spec.options.forEach(function (option) {
        this.store[spec.name][option.name] = option.defaultValue;
      }, this);
    }
  },

  initForm: function () {
    this.specs.forEach(function optionFromSpec(spec) {
      var prefix = 'settings_'
        , s = settings.store[spec.name]
        , first = spec.options[0]
        , name = spec.name + '_' + first.name
      ;
      $('settings_group_' + spec.group).grab(new Element('tr').adopt(
        new Element('td').grab(new Element('input', {
          id: prefix + name,
          name: name,
          checked: s[first.name],
          type: 'checkbox',
          events: {
            change: function () {
              s[first.name] = this.get('checked');
              settings.save();
            }
          }
        })),
        new Element('td').grab(new Element('label', {
          'for': prefix + name,
          text: first.description,
        }))
      ));
    }, this);
  },

  save: function () {
    storage.save('settings');
  },

  specs: [],
  store: storage.settings,
};

var exampleDefaults = {
  name: "VIP",
  group: "misc",
  options: [{
    name: "enable",
    description: "Turn on VIP quality",
    defaultValue: false,
  }, {
    name: "more",
    description: "Turbo Boost",
    defaultValue: true,
  }]
};

window.addEvent('domready', function() {
  settings.form = $('settings');
  settings.initForm();
  $('settings_link').addEvent('click', function (ev) {
    ev.preventDefault();
    if (settings.form.hasClass('invisible')) {
      settings.form.removeClass('invisible');
    } else {
      settings.form.addClass('invisible');
    }
  });
})
