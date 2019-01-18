const request = require('request');
const fs = require('fs');

const host = global.host || 'http://localhost:3000';

let getUrl = (songId) => {
    const qs = {
        id: songId,
        br: 999000
    }

    return new Promise((resolve, reject) => {
        request.get({url: `${host}/song/url`, qs: qs}, (err, res, body) => {
            if (err || res.statusCode != 200) {
                reject(err);
            }
            body = JSON.parse(body);
            let url = body.data[0].url || null;
            if(url) {
                resolve(url)
            }
            reject('No URL');
        })
    });
}


let download = function(uri, filename, callback){
    request.head(uri, function(err, res, body){
        console.log('content-type:', res.headers['content-type']);
        console.log('content-length:', res.headers['content-length']);

        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
};

module.exports = (query, request) => {
    const data = {
        id: 3779629,
        n: 10000
    }
    let result = request(
        'POST', `https://music.163.com/weapi/v3/playlist/detail`, data,
        {crypto: 'linuxapi', cookie: query.cookie, proxy: query.proxy}
    )

    result.then(answer => {
        let tracks = answer.body.playlist.tracks
        for(seq in tracks) {
            let trackItem = tracks[seq];

            let songId = trackItem.id;
            let songName = trackItem.name;
            let artistName = trackItem.ar.map( arItem => {
                return arItem.name;
            }).join(' & ');

            getUrl(songId).then( result => {
                let filename = `download/${songName}-${artistName}.mp3`;
                let url = result.url;
                if (!fs.existsSync(filename)) {
                    download(url, filename, function(){
                        console.log(`${filename} - done`);
                    });
                }
            }).catch(err => {
                console.log(err);
                download('https://www.google.com/images/srpr/logo3w.png', 'google.png', function(){
                    console.log('done');
                });
            });
        }
    })

    return result;
}