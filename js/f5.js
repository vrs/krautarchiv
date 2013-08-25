settings.register({
  name: "f5",
  group: "browsing",
  options: [{
    name: "enable",
    description: "Rebind F5 to just load new posts (unimplemented)",
    defaultValue: false,
  }],
});

if (settings.store.f5.enable) {
}
