settings.register({
  name: "infscroll",
  group: "browsing",
  options: [{
    name: "enable",
    description: "Enable infinite scroll (unimplemented)",
    defaultValue: false,
  }],
});

if (settings.store.infscroll.enable) {
}
