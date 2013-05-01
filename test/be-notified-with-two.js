var _ = require('underscore');
var request = require('request');
var Superfeedr  = require('../lib/superfeedr.js');

describe('BeNotifiedWithTwo', function(){
    var client = null;

    before(function(done) {
        client = new Superfeedr("nodesample", "nodesample");
        client.on('connected', function() {
            client.subscribe("http://push-pub.appspot.com/feed", function(err, feed) {
                if (err) {
                    done(err);
                }
                if (feed.url !== "http://push-pub.appspot.com/feed") {
                    done(new Error("The feed url is wrong " + feed.url));
                }
                done(); // Success. No error for now.
            });
        });
    });

    beforeEach(function() {
        // Ran before each test.
    });

    it('should receive a notification with two items', function(done){

        var one = _.after(2, done);

        client.on('notification', function(notification) {
            if(notification.feed.url !== "http://push-pub.appspot.com/feed") {
                done(new Error("This notification was not for the right feed"));
            }
            else if(notification.feed.title !== "Publisher example") {
                done(new Error("This notification's feed' title was not right"));
            }
            else if(notification.feed.httpCode !== 200) {
                done(new Error("This notification's feed' HTTP status code was not 200"));
            }

            if(notification.entries[0].title !== title && notification.entries[0].title !== title + " - bis")  {
                done(new Error("This notification's entry doesn't have 'hello' for title."));
            }
            else {
                one();
            }

        });

        var title = 'Testing Node.js wrapper for Superfeedr';
        var content = Date.now().toString();
        var params = {
            form: {}
        };
        params.form = {
            'title': title,
            'content': content,
            'double': 'on',
            'hub': 'http://pubsubhubbub.superfeedr.com',
            'name': ''
        };
        request.post('http://push-pub.appspot.com/', params);
    });
});

