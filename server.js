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

var get_toptracks = function(args) {
    debugger;
    var emitter = new events.EventEmitter();
    if(args && args.id){
        unirest.get('https://api.spotify.com/v1/artists/' + args.id + '/top-tracks?country=DK')
            //unirest.get('https://api.spotify.com/v1/artists/43ZHCT0cAZBISjO8DG9PnE/top-tracks?country=DK')
            .end(function(response) {
                if (response.ok) {

                    emitter.emit('items', response.body.tracks, args);
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
            var total = 0, complete = 0, errors = 0;
            if(!items.artists){
                this.emit('error', 404);
            }else{
                item.related = items.artists;
                total = item.related.length;
                item.related.map(function(related){
                    get_toptracks(related)
                        .on('items', function(items, current){
                            debugger;
                            current.tracks = items;
                            current.errors = errors;
                            complete++;
                            if(total === complete + errors){
                                res.json(item);
                                }
                            }
                        )
                        .on('error', function(error){
                            errors++;
                        }
                    );
                })
            }
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