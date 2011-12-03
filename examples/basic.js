var Superfeedr = require('superfeedr');

Superfeedr.on('notification', function(url, entries) {
    // Do stuff with the entries!
});

Superfeedr.subscribe('http://blog.superfeedr.com/atom.xml', function() {
    // Called when successfully subscribed
});

Superfeedr.unsubscribe('http://blog.superfeedr.com/atom.xml', function() {
    // Called when successfully un-subscribed
});
