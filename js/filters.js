settings.register({
  name: "filters",
  group: "browsing",
  options: [{
    name: "enable",
    description: "Use filters to ignore certain topics (unimplemented)",
    defaultValue: false,
  }],
});

if (settings.store.filters.enable) {
}
