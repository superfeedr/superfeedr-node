var Superfeedr  = require('../lib/superfeedr.js');

describe('List', function(){
    var client = null;

    before(function(done) {
        client = new Superfeedr("nodesample", "nodesample", "test");
        client.on('connected', function() {
            done();
        });
    });

    beforeEach(function(done) {
        client.subscribe("http://push-pub.appspot.com/feed", function(err, feed) {
            client.subscribe("http://blog.superfeedr.com/atom.xml", function(err, feed) {
                done();
            });
        });
    });

    it('should list our (correct) subscriptions', function(done) {
        client.list(function(err, feeds) {
            if (err) {
               done(err);
            } else if (feeds.length != 2) {
                done(new Error("nodesample account should be subscribed to exactly 2 feeds, bus was " + feeds.length))
            } else if (feeds[0].url != 'http://push-pub.appspot.com/feed') {
                done(new Error("The first feed must be 'http://push-pub.appspot.com/feed', but was '" + feeds[0].url) + '"');
            } else if (feeds[0].status != 'subscribed') {
                done(new Error("We are subscribed to the first feed"));
            } else if (feeds[1].url != 'http://blog.superfeedr.com/atom.xml') {
                done(new Error("The second feed must be 'http://blog.superfeedr.com/atom.xml', but was '" + feeds[1].url +'"'));
            } else if (feeds[1].status != 'subscribed') {
                done(new Error("We are subscribed to the second feed"));
            } else {
                done();
            }
      });
    });
});
