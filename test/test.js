var _ = require('underscore');
var request = require('request');
var Superfeedr = require('../lib/superfeedr.js');


describe('superfeedr', function () {
    var client = null;

    before(function (done) {
        client = new Superfeedr("nodesuperfeedrTest", "nodesuperfeedrTest123");
        client.on('connected', done);
        client.on('error', function(err) {
            done(new Error(err));
        });
    });

    describe('List', function () {
        before(function (done) {
            client.subscribe("http://push-pub.appspot.com/feed", function (err, feed) {
                client.subscribe("http://blog.superfeedr.com/atom.xml", function (err, feed) {
                    done();
                });
            });
        });

        it('should list our (correct) subscriptions', function (done) {
            client.list(function (err, feeds) {
                if (err) {
                    done(err);
                } else if (feeds.length != 2) {
                    done(new Error("nodesample account should be subscribed to exactly 2 feeds, bus was " + feeds.length))
                } else if (feeds[0].url != 'http://push-pub.appspot.com/feed') {
                    done(new Error("The first feed must be 'http://push-pub.appspot.com/feed', but was '" + feeds[0].url) + '"');
                } else if (feeds[0].status != 'subscribed') {
                    done(new Error("We are subscribed to the first feed"));
                } else if (feeds[1].url != 'http://blog.superfeedr.com/atom.xml') {
                    done(new Error("The second feed must be 'http://blog.superfeedr.com/atom.xml', but was '" + feeds[1].url + '"'));
                } else if (feeds[1].status != 'subscribed') {
                    done(new Error("We are subscribed to the second feed"));
                } else {
                    done();
                }
            });
        });
    });


    describe('retrieve', function() {
        before(function(done) {
            client.subscribe("http://blog.superfeedr.com/atom.xml", function(err, feed) {
                if(!err && feed.url === "http://blog.superfeedr.com/atom.xml" && feed.title === 'Superfeedr Blog') {
                    done();
                }
            });
        });

        it('should call the subscription callback', function(done) {
            client.retrieve('http://push-pub.appspot.com/feed', function(err, feed) {
                if (err)
                    done(new Error("There was an error"));

                if (!feed)
                    done(new Error("The feed was not retrieved"));

                if (!feed.entries || feed.entries.length < 1)
                    done(new Error('The feed should include entries'));

                var entry = feed.entries[0];

                if(!entry.links)
                    done(new Error('The entry should have links'));

                if(!entry.title)
                    done(new Error('The entry should have a title'));

                if(!entry.content)
                    done(new Error('The entry should have a content'));

                if(!entry.id)
                    done(new Error('The entry should have a id'));

                if(!entry.link)
                    done(new Error('The entry should have a link'));

                done();
            });
        });
    });


    describe('subscribe', function () {

        it('should call the subscription callback', function (done) {
            client.subscribe("http://blog.superfeedr.com/atom.xml", function (err, feed) {
                if (!err && feed.url === "http://blog.superfeedr.com/atom.xml" && feed.title === 'Superfeedr Blog') {
                    done();
                }
            });
        });
    });

    describe('unsubscribe', function () {


        before(function (done) {
            client.subscribe("http://blog.superfeedr.com/atom.xml", done)
        });

        it('should call the subscription callback', function (done) {
            client.unsubscribe("http://blog.superfeedr.com/atom.xml", function (err, feed) {
                if (!err && feed.url === "http://blog.superfeedr.com/atom.xml") {
                    done(); // Success. No error for now.
                }
            });
        });
    });

    describe('notifications', function () {
        before(function (done) {
            client.subscribe("http://push-pub.appspot.com/feed", function (err, feed) {
                if (!err && feed.url === "http://push-pub.appspot.com/feed") {
                    done();
                }
            });
        });

        describe('BeNotifiedSimple', function () {

            it('should receive a notification', function (done) {
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
                var onNotification = function (notification) {

                    if (notification.feed.url !== "http://push-pub.appspot.com/feed") {
                        done(new Error("This notification was not for the right feed"));
                    } else if (notification.feed.title !== "Publisher example") {
                        done(new Error("This notification's feed' title was not right"));
                    } else if (notification.feed.httpCode !== 200) {
                        done(new Error("This notification's feed' HTTP status code was not 200"));
                    } else if (notification.feed.nextFetch < new Date().getTime()) {
                        done(new Error("This notification's feed' nextFetch should be in the future"));
                    } else if (notification.feed.lastFetch >= new Date().getTime()) {
                        done(new Error("This notification's feed' lastFetch should be in the past"));
                    } else if (notification.feed.lastParse >= new Date().getTime()) {
                        done(new Error("This notification's feed' lastParse should be in the past"));
                    } else if (notification.feed.lastMaintenance >= new Date().getTime()) {
                        done(new Error("This notification's feed' lastMaintenance should be in the past"));
                    } else if (notification.entries.length != 1) {
                        done(new Error("This notification's doesn't have exactly one entry."));
                    } else if (notification.entries[0].postedTime >= new Date().getTime()) {
                        done(new Error("This notification's entry can't have been posted in the future."));
                    } else if (notification.entries[0].updated >= new Date().getTime()) {
                        done(new Error("This notification's entry can't have been updated in the future."));
                    } else if (notification.entries[0].title !== title) {
                        done(new Error("This notification's entry doesn't have the right title."));
                    } else if (notification.entries[0].content !== content) {
                        done(new Error("This notification's entry doesn't have the right content. We got ", notification.entries[0].content, " but expected ", content));
                    } else {
                        client.removeAllListeners('notification');
                        done();
                    }
                }
                client.on('notification', onNotification);
                request.post('http://push-pub.appspot.com/', params);
            });
        });

        describe('BeNotifiedWithResource', function () {

            it('should receive a notification', function (done) {
                var onNotification = function (notification) {
                    if (notification.feed.url !== "http://push-pub.appspot.com/feed") {
                        done(new Error("This notification was not for the right feed"));
                    } else if (notification.feed.title !== "Publisher example") {
                        done(new Error("This notification's feed' title was not right"));
                    } else if (notification.feed.httpCode !== 200) {
                        done(new Error("This notification's feed' HTTP status code was not 200"));
                    } else if (notification.feed.nextFetch < new Date().getTime()) {
                        done(new Error("This notification's feed' nextFetch should be in the future"));
                    } else if (notification.feed.lastFetch > new Date().getTime()) {
                        done(new Error("This notification's feed' lastFetch should be in the past"));
                    } else if (notification.feed.lastParse > new Date().getTime()) {
                        done(new Error("This notification's feed' lastParse should be in the past"));
                    } else if (notification.feed.lastMaintenance > new Date().getTime()) {
                        done(new Error("This notification's feed' lastMaintenance should be in the past"));
                    } else if (notification.entries.length != 1) {
                        done(new Error("This notification's doesn't have exactly one entry."));
                    } else if (notification.entries[0].postedTime > new Date().getTime()) {
                        done(new Error("This notification's entry can't have been posted in the future."));
                    } else if (notification.entries[0].updated > new Date().getTime()) {
                        done(new Error("This notification's entry can't have been updated in the future."));
                    } else if (notification.entries[0].title !== title) {
                        done(new Error("This notification's entry doesn't have the right title."));
                    } else if (notification.entries[0].summary && notification.entries[0].summary !== "") {
                        done(new Error("This notification's entry has a non empty summary"));
                    } else if (notification.entries[0].content !== content) {
                        done(new Error("This notification's entry doesn't have the right content."));
                    } else {
                        client.removeAllListeners('notification');
                        done();
                    }
                }
                client.on('notification', onNotification);

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

        describe('BeNotifiedWithTwo', function () {

            it('should receive a notification with two items', function (done) {
                var one = _.after(2, function () {
                    client.removeAllListeners('notification');
                    done();
                });
                client.on('notification', function (notification) {
                    if (notification.feed.url !== "http://push-pub.appspot.com/feed") {
                        done(new Error("This notification was not for the right feed"));
                    } else if (notification.feed.title !== "Publisher example") {
                        done(new Error("This notification's feed' title was not right"));
                    } else if (notification.feed.httpCode !== 200) {
                        done(new Error("This notification's feed' HTTP status code was not 200"));
                    }

                    if (notification.entries[0].title !== title && notification.entries[0].title !== title + " - bis") {
                        done(new Error("This notification's entry doesn't have 'hello' for title."));
                    } else {
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
    });
});
