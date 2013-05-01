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
      self.callbacks[stanza.attrs.id](stanza, self);
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
            } else if ('alternate' in json.links) {
              json['link'] = json.links['alternate'][0];
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

  this._parseSubscription = function(subscription, url) {
    if (!subscription) {
      return null;
    }
    var statusText = subscription.attrs.subscription;
    var status = subscription.getChild('status', 'http://superfeedr.com/xmpp-pubsub-ext');
    var httpStatus = status.getChild('http', 'http://superfeedr.com/xmpp-pubsub-ext');
    var nextFetch = status.getChild('next_fetch', 'http://superfeedr.com/xmpp-pubsub-ext');
    var title = status.getChild('title', 'http://superfeedr.com/xmpp-pubsub-ext');
    var period = status.getChild('period', 'http://superfeedr.com/xmpp-pubsub-ext');
    var lastFetch = status.getChild('last_fetch', 'http://superfeedr.com/xmpp-pubsub-ext');
    var lastParse = status.getChild('last_parse', 'http://superfeedr.com/xmpp-pubsub-ext');
    var lastMaintenance = status.getChild('last_maintenance_at', 'http://superfeedr.com/xmpp-pubsub-ext');
    var feed = {
      url: url,
      status: statusText,
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
    return feed;
  }
}

util.inherits(Superfeedr, EventEmitter);

Superfeedr.prototype.subscribe = function(url, clb) {
  var id = Math.floor(Math.random()*100000).toString();
  var subscribeStanza = new xmpp.Iq({to: SUPERFEEDR_ENDPOINT, id:id, type:'set', from: this.client.jid})
  .c("pubsub", {xmlns: "http://jabber.org/protocol/pubsub"})
  .c("subscribe", {node: url, jid: this.jid}).root();

  this.callbacks[id] = function(response, superfeedr) {
    if(response.attrs.type !== "result") {
      clb(new Error("Superfeedr responded with an error"), null);
      return;
    }

    var pubsub = response.getChild('pubsub', 'http://jabber.org/protocol/pubsub');
    if(!pubsub) {
      clb(new Error("Superfeedr did not respond with a pubsub"), null);
      return;
    }

    var subscription = pubsub.getChild('subscription', 'http://jabber.org/protocol/pubsub');
    if (!subscription) {
      clb(new Error("Superfeedr did not respond with a subscription"), null);
      return;
    }

    var feed = superfeedr._parseSubscription(subscription, url);
    if (feed.status === 'subscribed') {
      clb(null, feed);
    } else {
      clb(new Error("Feed was not subscribed"), null);
    }
  }
  this.client.send(subscribeStanza);
}

Superfeedr.prototype.unsubscribe = function(url, clb) {
  var id = Math.floor(Math.random()*100000).toString();
  var unsubscribeStanza = new xmpp.Iq({to: SUPERFEEDR_ENDPOINT, id:id, type:'set', from: this.client.jid})
  .c("pubsub", {xmlns: "http://jabber.org/protocol/pubsub"})
  .c("unsubscribe", {node: url, jid: this.jid}).root();
  this.callbacks[id] = function(response, superfeedr) {
    if(response.attrs.type === "result") {
      clb(null, {url: url});
    }
    else {
      clb({}, null);
    }
  }
  this.client.send(unsubscribeStanza);
}

/**
* iq[@from] : should match the bare jid you entered in your settings.
* subscriptions[@page] : page number (subscriptions will be sent by batches of 20).
* subscribe[@jid] : use your 'bare' jid (see settings).
* Sample request:
*
* <iq type="get" from="you@superfeedr.com" to="firehoser.superfeedr.com" id="subman1">
*   <pubsub xmlns="http://jabber.org/protocol/pubsub" xmlns:superfeedr="http://superfeedr.com/xmpp-pubsub-ext">
*    <subscriptions jid="you@superfeedr.com" superfeedr:page="3"/>
*  </pubsub>
* </iq>
* The server sends the list of resources to which you're subscribed for the page requested, as
* well as the status information for each of them.
*/
Superfeedr.prototype.list = function(page, clb) {
  var id = Math.floor(Math.random()*100000).toString();

  if (!page) {
    page = 1;
  }
  if (typeof page == "function") {
    clb = page;
    page = 1;
  }

  var listStanza = new xmpp.Iq({type:'get', from: this.client.jid, to: SUPERFEEDR_ENDPOINT, id:id})
    .c("pubsub", {xmlns: "http://jabber.org/protocol/pubsub", "xmlns:superfeedr":"http://superfeedr.com/xmpp-pubsub-ext"})
    .c("subscriptions", {jid: this.jid, "superfeedr:page":  page}).root();

  this.callbacks[id] = function(response, superfeedr) {
    if(response.attrs.type !== "result") {
      clb(new Error("Superfeedr responded with an error"), null);
    }

    var data = [];
    var pubsub = response.getChild('pubsub', 'http://jabber.org/protocol/pubsub');

    if (!pubsub) {
      clb(new Error("Superfeedr did not respond with a pubsub"), null)
    }

    var subscriptions = pubsub.getChild('subscriptions', 'http://jabber.org/protocol/pubsub');
    if (!subscriptions) {
      clb(new Error("Superfeedr did not respond with subscriptions"), null);
    }

    var children = subscriptions.getChildren("subscription", 'http://jabber.org/protocol/pubsub');
    var len = children.length;
    for (var i=0; i<len; i++) {

      var feed = superfeedr._parseSubscription(children[i], children[i].attrs.node);
      if (feed == null) {
        continue;
      }
      data.push(feed);
    }

    clb(null, data);
  };
  this.client.send(listStanza);
}


module.exports = Superfeedr;
