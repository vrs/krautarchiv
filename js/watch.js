settings.register({
  name: "watch",
  group: "browsing",
  options: [{
    name: "enable",
    description: "Enable thread watcher (unimplemented)",
    defaultValue: false,
  }],
});

if (settings.store.watch.enable) {
} else {
  document.head.appendChild(new Element('style[type=text/css]', {
    text: 'span.link_watch {display: none;}'
  }));
}

