var Superfeedr  = require('../lib/superfeedr.js');

describe('unsubscribe', function(){
    var client = null;

    before(function(done) {
        client = new Superfeedr("nodesample", "nodesample");
        client.on('connected', function() {
            done();
        });
    });

    beforeEach(function() {
        // Ran before each test.
    });

    it('should call the subscription callback', function(done){
        client.unsubscribe("http://blog.superfeedr.com/atom.xml", function(err, feed) {
            if(!err && feed.url === "http://blog.superfeedr.com/atom.xml") {
                done(); // Success. No error for now.
            }
        });
    });
});

