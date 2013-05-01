var request = require('request');
var Superfeedr  = require('../lib/superfeedr.js');

describe('BeNotifiedWithResource', function(){
    var client = null;

    before(function(done) {
        client = new Superfeedr("nodesample", "nodesample","test");
        client.on('connected', function() {
            client.subscribe("http://push-pub.appspot.com/feed", function(err, feed) {
                if(err) {
                    done(err);
                }

                if(feed.url !== "http://push-pub.appspot.com/feed") {
                    done(new Error("The feed url is wrong " + feed.url));
                }
                done(); // Success. No error for now.
            });
        });
    });

    beforeEach(function() {
        // Ran before each test.
    });

    it('should receive a notification', function(done){

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
            else if(notification.feed.nextFetch < new Date().getTime()) {
                done(new Error("This notification's feed' nextFetch should be in the future"));
            }
            else if(notification.feed.lastFetch > new Date().getTime()) {
                done(new Error("This notification's feed' lastFetch should be in the past"));
            }
            else if(notification.feed.lastParse > new Date().getTime()) {
                done(new Error("This notification's feed' lastParse should be in the past"));
            }
            else if(notification.feed.lastMaintenance > new Date().getTime()) {
                done(new Error("This notification's feed' lastMaintenance should be in the past"));
            }
            else if(notification.entries.length != 1) {
                done(new Error("This notification's doesn't have exactly one entry."));
            }
            else if(notification.entries[0].postedTime > new Date().getTime()) {
                done(new Error("This notification's entry can't have been posted in the future."));
            }
            else if(notification.entries[0].updated > new Date().getTime()) {
                done(new Error("This notification's entry can't have been updated in the future."));
            }
            else if(notification.entries[0].title !== title) {
                done(new Error("This notification's entry doesn't have the right title."));
            }
            else if(notification.entries[0].summary && notification.entries[0].summary !== "") {
                done(new Error("This notification's entry has a non empty summary"));
            }
            else if(notification.entries[0].content !== content) {
                done(new Error("This notification's entry doesn't have the right content."));
            }
            else {
                done(); // Success. No error for now.
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
            'double': '',
            'hub': 'http://pubsubhubbub.superfeedr.com',
            'name': ''
        };
        request.post('http://push-pub.appspot.com/', params);
    });
});

