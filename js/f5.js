settings.register({
  name: "f5",
  group: "browsing",
  options: [{
    name: "enable",
    description: "Rebind F5 to just load new posts (unimplemented)",
    defaultValue: false,
  }],
});

if (settings.store.f5.enable) { (function () {

$$(document).addEvent(
  'keydown',
  function (ev) {
    // stub, this actually needs sorting out of various idempotency issues
    var thread;
    if (ev.key === 'f5' && $$('main.thread').length) {
      ev.preventDefault();
      thread = new board.Thread($$('main.thread article.thread')[0]);
      console.log('f5');
      /*
      thread.onLoad(function updateThread(newthread) {
      });
      thread.get();
      */
    }
  });

})() }
