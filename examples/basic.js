var Superfeedr = require('superfeedr').Superfeedr;

client = new Superfeedr("login", "password");
client.on('connected', function() {
    client.subscribe("http://blog.superfeedr.com/atom.xml", function(err, feed) {
        // console.log(feed);
        // { url: 'http://blog.superfeedr.com/atom.xml',
        //   title: 'Superfeedr Blog : Real-time cloudy thoughts from a super-hero',
        //   httpCode: 200,
        //   httpStatus: '37345B in 0.602513587s, 0/10 new entries',
        //   period: 43200,
        //   nextFetch: 1323523524000,
        //   lastFetch: 1323479726000,
        //   lastParse: 1323479726000,
        //   lastMaintenance: 1323401451000 }
    });
    client.on('notification', function(notification) {
        // console.log(notification);
        // { feed: 
        //    { url: 'http://push-pub.appspot.com/feed',
        //      title: 'Publisher example',
        //      httpCode: 200,
        //      httpStatus: '4775B in 0.170247116s, 1/20 new entries',
        //      period: 43200,
        //      nextFetch: 1323527327000,
        //      lastFetch: 1323482789000,
        //      lastParse: 1323482791000,
        //      lastMaintenance: 1323436703000 },
        //   entries: 
        //    [ { id: 'http://push-pub.appspot.com/feed/93006',
        //        postedTime: 1323482787,
        //        updated: 1323482787,
        //        title: 'Hello',
        //        summary: '',
        //        content: 'World',
        //        actor: [Object] } ] }
    });
    
});
