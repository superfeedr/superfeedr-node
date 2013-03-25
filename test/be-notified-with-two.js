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

        console.log('Ready. Please trigger update at http://push-pub.appspot.com/. Put "Hello" in Title and "World" in Message and activate checkbox for "double"!');
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
            else if(notification.entries.length !== 2) {
                done(new Error("This notification's doesn't have exactly two entries."));
            }
            else if(notification.entries[0].title !== "Hello") {
                done(new Error("This notification's entry doesn't have 'hello' for title."));
            }
            else if(notification.entries[0].summary !== "") {
                done(new Error("This notification's entry has a non empty summary"));
            }
            else if(notification.entries[0].content !== "World") {
                done(new Error("This notification's entry doesn't have 'world' for title."));
            }
            else if(notification.entries[1].title !== "Hello - bis") {
                done(new Error("This notification's entry doesn't have 'hello' for title."));
            }
            else if(notification.entries[1].summary !== "") {
                done(new Error("This notification's entry has a non empty summary"));
            }
            else if(notification.entries[1].content !== "World - bis") {
                done(new Error("This notification's entry doesn't have 'world' for title."));
            }
            else {
                done(); // Success. No error for now.
            }
        });
    });
});

