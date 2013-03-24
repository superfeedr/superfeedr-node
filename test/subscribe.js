var Superfeedr  = require('../lib/superfeedr.js');

describe('subscribe', function(){
  var client = null;

  before(function(done) {
    client = new Superfeedr("nodesample", "nodesample");
    client.on('connected', function() {
      done();
    });
  });

  it('should call the subscription callback', function(done){
    client.subscribe("http://blog.superfeedr.com/atom.xml", function(err, feed) {
      if(!err && feed.url === "http://blog.superfeedr.com/atom.xml" && feed.title === 'Superfeedr Blog : Real-time cloudy thoughts from a super-hero') {
        done();
      }
    });
  });
});

