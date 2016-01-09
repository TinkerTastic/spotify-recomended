var unirest = require('unirest');
var express = require('express');
var events = require('events');
var app = express();

app.use(express.static('public'));

var get_artist = function(args) {
    var emitter = new events.EventEmitter();

    unirest.get('https://api.spotify.com/v1/search')
        .qs(args)
        .end(function(response) {
            if (response.ok) {
                emitter.emit('item', response.body);
            }
            else {
                emitter.emit('error', response.code);
            }
        });
    return emitter;
};

var get_related = function(args) {
    debugger;
    var emitter = new events.EventEmitter();
    if(args && args.id){
    unirest.get('https://api.spotify.com/v1/artists/' + args.id + '/related-artists')
    //unirest.get('https://api.spotify.com/v1/artists/43ZHCT0cAZBISjO8DG9PnE/related-artists')
        .end(function(response) {
            if (response.ok) {
                emitter.emit('items', response.body);
            }
            else {
                emitter.emit('error', response.code);
            }
        });
    }
    return emitter;
};

app.get('/search/:name', function(req, res) {
    var search_related = null;
    var search_artist = get_artist({
        q: req.params.name,
        limit: 1,
        type: 'artist'
    });

    search_artist.on('item', function(item){
        debugger;
        var search_related = get_related(item.artists.items[0]);

        search_related.on('items', function(items){
            item.related = items.artists;
            res.json(item)
        });

        search_related.on('error', function(error){
            errorhandler(error);
        });
    });

    search_artist.on('error', function(error){
        errorhandler(error);
    });

    var errorhandler = function(code){
        res.sendStatus(code);
    };

});

app.listen(8080);