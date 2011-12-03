var Superfeedr = require('superfeedr');

Superfeedr('login', 'password', function(client) {
    client.on('notification', function(url, entries) {
        // Do stuff with the entries!
    });

    client.subscribe('http://blog.superfeedr.com/atom.xml', function() {
        // Called when successfully subscribed
    });

    client.unsubscribe('http://blog.superfeedr.com/atom.xml', function() {
        // Called when successfully un-subscribed
    });
    
});

