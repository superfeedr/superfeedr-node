var Superfeedr  = require('../lib/superfeedr.js').Superfeedr;

describe('Subscription', function(){
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
        client.subscribe("http://blog.superfeedr.com/atom.xml", function(err, feed) {
            // console.log(feed); // If you want to see the full feed object.
            if(!err && feed.url === "http://blog.superfeedr.com/atom.xml" && feed.title === 'Superfeedr Blog : Real-time cloudy thoughts from a super-hero') {
                done(); // Success. No error for now.
            }
        });
    });
});
    
