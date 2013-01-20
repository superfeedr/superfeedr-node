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

      notification.feed = {};
      notification.feed.url = status.attrs.feed;
      if(title) {
        notification.feed.title = title.getText();
      }
      else {
        notification.feed.title = ";"
      }
      notification.feed.httpCode = parseInt(httpStatus.attrs.code);
      notification.feed.httpStatus = httpStatus.getText();
      notification.feed.period = parseInt(period.getText());
      notification.feed.nextFetch = Date.parse(nextFetch.getText());
      notification.feed.lastFetch = Date.parse(lastFetch.getText());
      notification.feed.lastParse = Date.parse(lastParse.getText());
      notification.feed.lastMaintenance = Date.parse(lastMaintenance.getText());
      notification.entries = [];

      var itemsNode = psevent.getChild('items', 'http://jabber.org/protocol/pubsub#event');
      if(itemsNode) {
        var itemsList = itemsNode.getChildren('item', 'http://jabber.org/protocol/pubsub');

        itemsList.forEach(function(item) {
          var entry = item.getChild('entry', 'http://www.w3.org/2005/Atom');
          var json = {
            links: {},
            authors: []
          };
          ['title', 'summary', 'content', 'published', 'updated', 'id'].forEach(function(key) {
            var el = entry.getChild(key);
            if (el)
              json[key] = el.getText();
          });

          // By default, first link is link
          var el = entry.getChild('link');
          if (el) {
            json['link'] = el.attrs;
          }

          // All links are links
          var links = entry.getChildren('link');
          if(links) {
            links.forEach(function(el) {
              if(el.attrs.rel) {
                if(!json.links[el.attrs.rel]) {
                  json.links[el.attrs.rel] = [];
                }
                json.links[el.attrs.rel].push(el.attrs);
              }
            });
            // If rel="canonical" link is present, use that instead of the first link
            if ('canonical' in json.links) {
              json['link'] = json.links['canonical'][0];
            }
          }

          // All categories are categories
          var categories = entry.getChildren('category');
          if(categories) {
            json.categories = [];
            categories.forEach(function(el) {
              json.categories.push(el.attrs);
            });
          }

          // All authors are authors:
          var authors = entry.getChildren('author', 'http://www.w3.org/2005/Atom');
          if(authors) {
            authors.forEach(function(el) {
              var author = {}
              author.name = el.getChildText('name', 'http://www.w3.org/2005/Atom');
              author.uri = el.getChildText('uri', 'http://www.w3.org/2005/Atom');
              author.email = el.getChildText('email', 'http://www.w3.org/2005/Atom');
              json.authors.push(author);
            });
          }

          notification.entries.push(json);
        });
        delete self.callbacks[stanza.attrs.id];
        self.emit('notification', notification);
      }
      else {
        self.emit('status', notification);
      }
    }
  });
}

util.inherits(Superfeedr, EventEmitter);

Superfeedr.prototype.subscribe = function(url, clb) {
  var id = Math.floor(Math.random()*100000).toString();
  var subscribeStanza = new xmpp.Iq({to: SUPERFEEDR_ENDPOINT, id:id, type:'set', from: this.client.jid})
  .c("pubsub", {xmlns: "http://jabber.org/protocol/pubsub"})
  .c("subscribe", {node: url, jid: this.jid}).root();
  this.callbacks[id] = function(response) {
    if(response.attrs.type === "result") {
      var pubsub = response.getChild('pubsub', 'http://jabber.org/protocol/pubsub');
      if(pubsub) {
        var subscription = pubsub.getChild('subscribe', 'http://jabber.org/protocol/pubsub');
        if(subscription) {
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
              title: ((title !== undefined) ? title.getText() : ';'),
              httpCode: parseInt(httpStatus.attrs.code),
              httpStatus: httpStatus.getText(),
              period: parseInt(period.getText()),
            }
            if(nextFetch) {
              feed.nextFetch = Date.parse(nextFetch.getText());
            }
            if(lastFetch) {
              feed.lastFetch = Date.parse(lastFetch.getText());
            }
            if(lastParse) {
              feed.lastParse = Date.parse(lastParse.getText());
            }
            if(lastMaintenance) {
              feed.lastMaintenance = Date.parse(lastMaintenance.getText());
            }
            clb(null, feed);
          }
          else {
            clb(new Error("Feed was not subscribed"), null)
          }
        }
        else {
          clb(new Error("Superfeedr did not respond with a subscription"), null)
        }
      }
      else {
        clb(new Error("Superfeedr did not respond with a pubsub"), null)
      }
    }
    else {
      clb(new Error("Superfeedr responded with an error"), null)
    }
  };
  this.client.send(subscribeStanza);
}

Superfeedr.prototype.unsubscribe = function(url, clb) {
  var id = Math.floor(Math.random()*100000).toString();
  var unsubscribeStanza = new xmpp.Iq({to: SUPERFEEDR_ENDPOINT, id:id, type:'set', from: this.client.jid})
  .c("pubsub", {xmlns: "http://jabber.org/protocol/pubsub"})
  .c("unsubscribe", {node: url, jid: this.jid}).root();
  this.callbacks[id] = function(response) {
    if(response.attrs.type === "result") {
      clb(null, {url: url});
    }
    else {
      clb({}, null);
    }
  }
  this.client.send(unsubscribeStanza);
}


module.exports = Superfeedr;
