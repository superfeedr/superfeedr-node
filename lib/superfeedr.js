var xmpp = require('node-xmpp');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

SUPERFEEDR_ENDPOINT = "firehoser.superfeedr.com";

function Superfeedr(login, password, resource) {
    this.jid = login + "@superfeedr.com";
    if(resource !== undefined) {
        this.jid += '/'+resource
    }
    
    this.callbacks = {};
    this.client = new xmpp.Client({ jid: this.jid, password: password });
    var self = this;
    
    this.client.on('online', function() {
        self.client.send(new xmpp.Element('presence', { }).c('show').t('chat').up().c('status').t(''));
        self.emit('connected');
    });
    
    this.client.on('stanza', function(stanza) {
        if(self.callbacks[stanza.attrs.id]) {
            self.callbacks[stanza.attrs.id](stanza);
        }
        else {
            var notification = {};
            var psevent = stanza.getChild('event', 'http://jabber.org/protocol/pubsub#event');
            var status = psevent.getChild('status', 'http://superfeedr.com/xmpp-pubsub-ext');
            var httpStatus = status.getChild('http', 'http://superfeedr.com/xmpp-pubsub-ext');
            var nextFetch = status.getChild('next_fetch', 'http://superfeedr.com/xmpp-pubsub-ext');
            var title = status.getChild('title', 'http://superfeedr.com/xmpp-pubsub-ext');
            var period = status.getChild('period', 'http://superfeedr.com/xmpp-pubsub-ext');
            var lastFetch = status.getChild('last_fetch', 'http://superfeedr.com/xmpp-pubsub-ext');
            var lastParse = status.getChild('last_parse', 'http://superfeedr.com/xmpp-pubsub-ext');
            var lastMaintenance = status.getChild('last_maintenance_at', 'http://superfeedr.com/xmpp-pubsub-ext');
            
            notification.feed = {
                url:status.attrs.feed,
                title: title.getText(),
                httpCode: parseInt(httpStatus.attrs.code),
                httpStatus: httpStatus.getText(),
                period: parseInt(period.getText()),
                nextFetch: Date.parse(nextFetch.getText()),
                lastFetch: Date.parse(lastFetch.getText()),
                lastParse: Date.parse(lastParse.getText()),
                lastMaintenance: Date.parse(lastMaintenance.getText())
            }
            notification.entries = [];
            
            var items = psevent.getChildren('items', 'http://jabber.org/protocol/pubsub#event');
            items.forEach(function(item) {
                var entry = item.getChild('item', 'http://jabber.org/protocol/pubsub#event');
                var content = entry.getChild('content', 'http://www.w3.org/2005/Atom').getText();
                notification.entries.push(JSON.parse(content));
            });
            
            self.emit('notification', notification);
        }
    });
}

util.inherits(Superfeedr, EventEmitter);

Superfeedr.prototype.subscribe = function(url, clb) {
    var id = Math.floor(Math.random()*100000);
    var subscribeStanza = new xmpp.Iq({to: SUPERFEEDR_ENDPOINT, id:id, type:'set', from: this.client.jid})
        .c("pubsub", {xmlns: "http://jabber.org/protocol/pubsub"})
            .c("subscribe", {node: url, jid: this.jid}).root();
    subscribeStanza.getChild('pubsub', 'http://jabber.org/protocol/pubsub').getChild('subscribe', 'http://jabber.org/protocol/pubsub').attrs['xmlns:sf'] = 'http://superfeedr.com/xmpp-pubsub-ext';
    subscribeStanza.getChild('pubsub', 'http://jabber.org/protocol/pubsub').getChild('subscribe', 'http://jabber.org/protocol/pubsub').attrs['sf:format'] = 'json';
    this.callbacks[id] = function(response) {
        if(response.attrs.type === "result") {
            var subscription = null;
            var pubsub = response.getChild('pubsub', 'http://jabber.org/protocol/pubsub');
            if(subscription = pubsub.getChild('subscription', 'http://jabber.org/protocol/pubsub')) {
                if(subscription.attrs.subscription === 'subscribed') {
                    var status = subscription.getChild('status', 'http://superfeedr.com/xmpp-pubsub-ext');
                    var httpStatus = status.getChild('http', 'http://superfeedr.com/xmpp-pubsub-ext');
                    var nextFetch = status.getChild('next_fetch', 'http://superfeedr.com/xmpp-pubsub-ext');
                    var title = status.getChild('title', 'http://superfeedr.com/xmpp-pubsub-ext');
                    var period = status.getChild('period', 'http://superfeedr.com/xmpp-pubsub-ext');
                    var lastFetch = status.getChild('last_fetch', 'http://superfeedr.com/xmpp-pubsub-ext');
                    var lastParse = status.getChild('last_parse', 'http://superfeedr.com/xmpp-pubsub-ext');
                    var lastMaintenance = status.getChild('last_maintenance_at', 'http://superfeedr.com/xmpp-pubsub-ext');
                    var feed = {
                        url:url,
                        title: title.getText(),
                        httpCode: parseInt(httpStatus.attrs.code),
                        httpStatus: httpStatus.getText(),
                        period: parseInt(period.getText()),
                        nextFetch: Date.parse(nextFetch.getText()),
                        lastFetch: Date.parse(lastFetch.getText()),
                        lastParse: Date.parse(lastParse.getText()),
                        lastMaintenance: Date.parse(lastMaintenance.getText())
                    }
                    clb(null, feed);
                }
                else {
                    clb({}, null); // We raise an error!
                }
            }
            else {
                clb({}, null); // We raise an error!
            }
        }
        else {
            clb({}, null); // We raise an error!
        }
    };
    this.client.send(subscribeStanza);
}

Superfeedr.prototype.unsubscribe = function(url, clb) {
    var id = Math.floor(Math.random()*100000);
    var unsubscribeStanza = new xmpp.Iq({to: SUPERFEEDR_ENDPOINT, id:id, type:'set', from: this.client.jid})
        .c("pubsub", {xmlns: "http://jabber.org/protocol/pubsub"})
            .c("unsubscribe", {node: url, jid: this.jid}).root();
    this.callbacks[id] = function(response) {
        if(response.attrs.type === "result") {
            clb(null, {url: url});
        }
        else {
            clb({}, null); // We raise an error!
        }
    }
    this.client.send(unsubscribeStanza);
}


exports.Superfeedr = Superfeedr;