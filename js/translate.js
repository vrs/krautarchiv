settings.register({
  name: "translate",
  group: "thirdparty",
  options: [{
    name: "enable",
    description: "Enable inline translation of posts (Yandex) (unimplemented)",
    defaultValue: false,
  }],
});

if (settings.store.translate.enable) {
} else {
  document.head.appendChild(new Element('style[type=text/css]', {
    text: 'span.link_translate {display: none;}'
  }));
}

